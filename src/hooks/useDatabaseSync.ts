import { useState, useEffect, useCallback, useRef } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import { supabase } from "../supabase";
import Database from "@tauri-apps/plugin-sql";
import { StudyType } from "../types/Studies";
// Tables that need to be synchronized
// Order is important due to foreign key constraints
const TABLES = [
  { name: "coach", primaryKey: "id" }, // Coach must come before athlete due to foreign key
  { name: "athlete", primaryKey: "id" },
  { name: "base_result", primaryKey: "id" }, // Base result must come before all tables that reference it
  { name: "bosco_result", primaryKey: "id" },
  { name: "event", primaryKey: "id" },
  { name: "multiple_drop_jump_result", primaryKey: "id" },
  // All tables below reference base_result and must come after it
  { name: "basic_result", primaryKey: "id" },
  { name: "drop_jump_result", primaryKey: "id" },
  { name: "multiple_jumps_result", primaryKey: "id" },
  { name: "jump_time", primaryKey: "id" },
];

type SyncStatus = "idle" | "syncing" | "success" | "error";

interface SyncStats {
  uploaded: number;
  downloaded: number;
  conflicts: number;
  tables: Record<string, { uploaded: number; downloaded: number }>;
  errors: { table: string; error: string }[];
}

export function useDatabaseSync() {
  const { isOnline } = useOnlineStatus();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncStats, setSyncStats] = useState<SyncStats>({
    uploaded: 0,
    downloaded: 0,
    conflicts: 0,
    tables: {},
    errors: [],
  });
  const [error, setError] = useState<string | null>(null);

  // Add a ref to track if sync is in progress to prevent concurrent syncs
  const isSyncInProgressRef = useRef(false);
  // Track if we've done the initial sync
  const hasPerformedInitialSyncRef = useRef(false);

  const lastSyncAttemptTimeRef = useRef<number>(0);

  // Normalize timestamp formats between SQLite and PostgreSQL
  const normalizeTimestamp = (timestamp: string): string => {
    // Handle case where timestamp might be null or undefined
    if (!timestamp) return new Date().toISOString();

    // Convert PostgreSQL timestamptz to ISO string if needed
    if (timestamp.includes("+")) {
      return new Date(timestamp).toISOString();
    }

    // Convert SQLite timestamp to ISO string if needed
    try {
      return new Date(timestamp).toISOString();
    } catch (e) {
      return new Date().toISOString();
    }
  };

  // Compare timestamps and determine which is newer
  const isTimestampNewer = (
    timestamp1: string,
    timestamp2: string
  ): boolean => {
    // Handle cases where timestamps might be null or undefined string representations
    // normalizeTimestamp already handles !timestamp, so direct pass should be fine.

    const t1Norm = normalizeTimestamp(timestamp1);
    const t2Norm = normalizeTimestamp(timestamp2);

    const time1 = new Date(t1Norm).getTime();
    const time2 = new Date(t2Norm).getTime();

    return time1 > time2;
  };

  // Sync a single table between Supabase and SQLite
  const syncTable = useCallback(
    async (tableName: string, primaryKey: string) => {
      try {
        const db = await Database.load("sqlite:ergolab.db");
        const tableStats = { uploaded: 0, downloaded: 0 };

        // Add a timeout for this sync operation to prevent hanging
        const syncPromise = (async () => {
          // 1. Pull changes from Supabase
          const { data: remoteChanges, error: fetchError } = await supabase
            .from(tableName)
            .select("*");

          if (fetchError)
            throw new Error(
              `Error fetching from Supabase: ${fetchError.message}`
            );

          // 2. Get all local changes
          const localChanges = await db.select(`SELECT * FROM "${tableName}"`);

          // 3. Apply remote changes to local database
          if (
            remoteChanges &&
            Array.isArray(remoteChanges) &&
            remoteChanges.length > 0
          ) {
            for (const row of remoteChanges) {
              try {
                // Check if record exists locally
                const existingRecord = await db.select(
                  `SELECT * FROM "${tableName}" WHERE "${primaryKey}" = ?`,
                  [row[primaryKey]]
                );

                // Handle conflict resolution if exists locally
                if (
                  Array.isArray(existingRecord) &&
                  existingRecord.length > 0
                ) {
                  const localRecord = existingRecord[0];

                  // Compare timestamps to determine which version is newer
                  if (
                    isTimestampNewer(row.last_changed, localRecord.last_changed)
                  ) {
                    // Remote is newer, update local
                    const columns = Object.keys(row).filter(
                      (k) => k !== primaryKey
                    );
                    const placeholders = columns.map(() => "?").join(", ");
                    const sets = columns
                      .map((col) => `"${col}" = ?`)
                      .join(", ");

                    try {
                      await db.execute(
                        `UPDATE "${tableName}" SET ${sets} WHERE "${primaryKey}" = ?`,
                        [...columns.map((col) => row[col]), row[primaryKey]]
                      );
                      tableStats.downloaded++;
                    } catch (updateError) {
                      throw updateError;
                    }
                  }
                } else {
                  // Record doesn't exist locally, insert it
                  const columns = Object.keys(row);
                  const placeholders = columns.map(() => "?").join(", ");

                  try {
                    await db.execute(
                      `INSERT INTO "${tableName}" ("${columns.join(
                        '", "'
                      )}") VALUES (${placeholders})`,
                      columns.map((col) => row[col])
                    );
                    tableStats.downloaded++;
                  } catch (insertError) {
                    const errorMessage =
                      insertError instanceof Error
                        ? insertError.message
                        : String(insertError);
                    if (
                      errorMessage.includes("FOREIGN KEY constraint failed")
                    ) {
                      throw new Error(
                        `Foreign key constraint failed in ${tableName}. Ensure referenced tables are synced first.`
                      );
                    } else {
                      throw insertError;
                    }
                  }
                }
              } catch (rowError) {
                const errorMessage =
                  rowError instanceof Error
                    ? rowError.message
                    : String(rowError);
                if (
                  !errorMessage.includes("FOREIGN KEY constraint failed") &&
                  !errorMessage.includes("Foreign key constraint failed")
                ) {
                  throw rowError;
                }
                throw rowError;
              }
            }
          }

          // 4. Apply local changes to Supabase
          if (Array.isArray(localChanges) && localChanges.length > 0) {
            for (const row of localChanges) {
              try {
                // Check if record exists remotely
                const { data: existingRemote, error: remoteCheckError } =
                  await supabase
                    .from(tableName)
                    .select(primaryKey)
                    .eq(primaryKey, row[primaryKey])
                    .single();

                if (remoteCheckError && remoteCheckError.code !== "PGRST116") {
                  throw new Error(
                    `Error checking remote record ${
                      row[primaryKey]
                    } in ${tableName}: ${remoteCheckError.message} (Code: ${
                      remoteCheckError.code || "N/A"
                    }, Details: ${remoteCheckError.details || "N/A"}, Hint: ${
                      remoteCheckError.hint || "N/A"
                    })`
                  );
                }

                if (existingRemote) {
                  // Record exists remotely, get it to compare timestamps
                  const { data: remoteRecord, error: getRemoteError } =
                    await supabase
                      .from(tableName)
                      .select("*")
                      .eq(primaryKey, row[primaryKey])
                      .single();

                  if (getRemoteError) {
                    throw new Error(
                      `Error getting remote record: ${getRemoteError.message}`
                    );
                  }

                  // Compare timestamps to determine which version is newer
                  if (
                    isTimestampNewer(
                      row.last_changed,
                      remoteRecord.last_changed
                    )
                  ) {
                    // Local is newer, update remote
                    try {
                      const { error: updateError } = await supabase
                        .from(tableName)
                        .update(row)
                        .eq(primaryKey, row[primaryKey]);

                      if (updateError) {
                        throw new Error(
                          `Error updating remote record: ${updateError.message}`
                        );
                      }
                      tableStats.uploaded++;
                    } catch (supaUpdateError) {
                      throw supaUpdateError;
                    }
                  }
                } else {
                  // Record doesn't exist remotely, insert it
                  try {
                    const { error: insertError } = await supabase
                      .from(tableName)
                      .insert(row);

                    if (insertError) {
                      throw new Error(
                        `Error inserting remote record ${
                          row[primaryKey]
                        } in ${tableName}: ${insertError.message} (Code: ${
                          insertError.code || "N/A"
                        }, Details: ${insertError.details || "N/A"}, Hint: ${
                          insertError.hint || "N/A"
                        })`
                      );
                    }
                    tableStats.uploaded++;
                  } catch (supaInsertError) {
                    throw supaInsertError;
                  }
                }
              } catch (rowProcessingError) {
                throw rowProcessingError;
              }
            }
          }

          return tableStats;
        })();

        // Set a timeout to prevent indefinite hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Sync timeout for table ${tableName}`));
          }, 30000); // 30 second timeout
        });

        // Race the sync operation against the timeout
        return (await Promise.race([syncPromise, timeoutPromise])) as {
          uploaded: number;
          downloaded: number;
        };
      } catch (error) {
        throw error;
      }
    },
    [isTimestampNewer]
  );

  // Main sync function that syncs all tables
  const syncAllTables = useCallback(
    async (force: boolean = false) => {
      const now = Date.now();

      // Prevent multiple syncs from running at the same time
      if (isSyncInProgressRef.current) {
        return;
      }

      // Update last attempt time
      lastSyncAttemptTimeRef.current = now;

      if (!isOnline) {
        setError("Cannot sync while offline");
        setSyncStatus("error");
        return;
      }

      try {
        // Set flag to indicate sync is in progress
        isSyncInProgressRef.current = true;
        setSyncStatus("syncing");
        setError(null);

        // Current timestamp for this sync operation
        const now = new Date().toISOString();

        // Initialize sync stats
        const stats: SyncStats = {
          uploaded: 0,
          downloaded: 0,
          conflicts: 0,
          tables: {},
          errors: [],
        };

        // Keep track of which tables have been synced successfully
        const syncedTables = new Set<string>();

        // Keep track of tables that failed due to foreign key constraints for retry
        const retryTables: Array<{
          name: string;
          primaryKey: string;
          attempts: number;
        }> = [];

        // Maximum number of retry attempts per table
        const MAX_RETRY_ATTEMPTS = 3;

        // First pass - try to sync each table in the order defined in TABLES
        for (const table of TABLES) {
          try {
            const tableStats = await syncTable(table.name, table.primaryKey);
            stats.tables[table.name] = tableStats;
            stats.uploaded += tableStats.uploaded;
            stats.downloaded += tableStats.downloaded;
            syncedTables.add(table.name);
          } catch (tableError) {
            const errorMessage =
              tableError instanceof Error
                ? tableError.message
                : String(tableError);

            // If it's a foreign key constraint error, add to retry list
            if (
              errorMessage.includes("Foreign key constraint failed") ||
              errorMessage.includes("FOREIGN KEY constraint failed") ||
              errorMessage.includes("violates foreign key constraint") ||
              errorMessage.includes("Code: 23503")
            ) {
              retryTables.push({
                name: table.name,
                primaryKey: table.primaryKey,
                attempts: 0,
              });
            } else {
              stats.errors.push({
                table: table.name,
                error: errorMessage,
              });
            }
          }
        }

        // Second pass - retry tables that failed due to foreign key constraints
        // Keep trying until no more tables can be synced or max attempts reached
        let progress = true;
        while (progress && retryTables.length > 0) {
          progress = false;

          // Create a copy of the retry array that we can modify while iterating
          const currentRetryTables = [...retryTables];
          retryTables.length = 0;

          for (const retryTable of currentRetryTables) {
            // Skip if already synced (shouldn't happen but just in case)
            if (syncedTables.has(retryTable.name)) continue;

            // Skip if exceeded max attempts
            if (retryTable.attempts >= MAX_RETRY_ATTEMPTS) {
              stats.errors.push({
                table: retryTable.name,
                error: `Failed after ${MAX_RETRY_ATTEMPTS} attempts due to foreign key constraints`,
              });
              continue;
            }

            retryTable.attempts++;

            try {
              const tableStats = await syncTable(
                retryTable.name,
                retryTable.primaryKey
              );

              // Success! Add to stats and mark as synced
              stats.tables[retryTable.name] = tableStats;
              stats.uploaded += tableStats.uploaded;
              stats.downloaded += tableStats.downloaded;
              syncedTables.add(retryTable.name);
              progress = true;
            } catch (retryError) {
              const errorMessage =
                retryError instanceof Error
                  ? retryError.message
                  : String(retryError);

              // If it's still a foreign key error and not at max attempts, keep it in retry list
              if (
                (errorMessage.includes("Foreign key constraint failed") ||
                  errorMessage.includes("FOREIGN KEY constraint failed") ||
                  errorMessage.includes("violates foreign key constraint") ||
                  errorMessage.includes("Code: 23503")) &&
                retryTable.attempts < MAX_RETRY_ATTEMPTS
              ) {
                retryTables.push(retryTable);
              } else {
                stats.errors.push({
                  table: retryTable.name,
                  error: `Failed on retry ${retryTable.attempts}: ${errorMessage}`,
                });
              }
            }
          }
        }

        setSyncStats(stats);

        // Set appropriate status based on whether there were any errors
        if (stats.errors.length > 0) {
          setSyncStatus("error");
          setError(
            `Sync completed with errors in tables: ${stats.errors
              .map((e) => e.table)
              .join(", ")}`
          );
        } else {
          setSyncStatus("success");
        }

        // After sync completes
        isSyncInProgressRef.current = false;
        hasPerformedInitialSyncRef.current = true;
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
        setSyncStatus("error");
        isSyncInProgressRef.current = false;
      }
    },
    [isOnline, syncTable]
  );

  // Function to sync a specific table
  const syncSpecificTable = useCallback(
    async (tableName: string, force: boolean = false) => {
      const now = Date.now();

      if (isSyncInProgressRef.current) {
        console.log("Sync already in progress, skipping this request");
        return;
      }

      if (!isOnline) {
        setError("Cannot sync while offline");
        setSyncStatus("error");
        return;
      }

      try {
        isSyncInProgressRef.current = true;
        setSyncStatus("syncing");
        setError(null);

        const now = new Date().toISOString();

        const table = TABLES.find((t) => t.name === tableName);
        if (!table) {
          throw new Error(`Table ${tableName} not found in sync configuration`);
        }

        const tableStats = await syncTable(table.name, table.primaryKey);

        // Update sync stats for this table
        setSyncStats((prev) => ({
          ...prev,
          uploaded: prev.uploaded + tableStats.uploaded,
          downloaded: prev.downloaded + tableStats.downloaded,
          tables: {
            ...prev.tables,
            [tableName]: tableStats,
          },
        }));

        setSyncStatus("success");
      } catch (error) {
        console.error(`Error syncing table ${tableName}:`, error);
        setError(error instanceof Error ? error.message : String(error));
        setSyncStatus("error");
      } finally {
        isSyncInProgressRef.current = false;
      }
    },
    [isOnline, syncTable]
  );

  // Function to upload data to local DB and sync
  const uploadAndSyncTable = useCallback(
    async (tableName: string, data: any[]) => {
      try {
        const db = await Database.load("sqlite:ergolab.db");
        const table = TABLES.find((t) => t.name === tableName);

        if (!table) {
          throw new Error(`Table ${tableName} not found in sync configuration`);
        }

        // Add last_changed timestamp to each record
        const now = new Date().toISOString();
        const dataWithTimestamp = data.map((record) => ({
          ...record,
          last_changed: now,
        }));

        // Insert or update records in local DB
        for (const record of dataWithTimestamp) {
          const columns = Object.keys(record);
          const placeholders = columns.map(() => "?").join(", ");

          await db.execute(
            `INSERT OR REPLACE INTO "${tableName}" ("${columns.join(
              '", "'
            )}") VALUES (${placeholders})`,
            columns.map((col) => record[col])
          );
        }

        // If local upload successful, sync with Supabase
        await syncSpecificTable(tableName);

        return true;
      } catch (error) {
        console.error(`Error in uploadAndSyncTable for ${tableName}:`, error);
        throw error;
      }
    },
    [syncSpecificTable]
  );

  const syncBosco = async () => {
    await syncSpecificTable("base_result");
    await syncSpecificTable("bosco_result");
    await syncSpecificTable("basic_result");
    await syncSpecificTable("jump_time");
  };

  const syncDropJump = async () => {
    await syncSpecificTable("base_result");
    await syncSpecificTable("drop_jump_result");
    await syncSpecificTable("multiple_drop_jump_result");
    await syncSpecificTable("jump_time");
  };

  const syncMultipleJumps = async () => {
    await syncSpecificTable("base_result");
    await syncSpecificTable("multiple_jumps_result");
    await syncSpecificTable("jump_time");
  };

  const syncBasic = async () => {
    await syncSpecificTable("base_result");
    await syncSpecificTable("basic_result");
    await syncSpecificTable("jump_time");
  };

  const syncResult = async (resultType: StudyType) => {
    console.log("Syncing result", resultType);
    switch (resultType) {
      case "bosco":
        await syncBosco();
        break;
      case "multipleDropJump":
        await syncDropJump();
        break;
      case "multipleJumps":
        await syncMultipleJumps();
        break;
      default:
        await syncBasic();
    }
  };
  // Trigger sync when coming back online
  useEffect(() => {
    let mounted = true;
    let initialSyncTimeoutId: number | null = null;

    const handleOnlineStatusChange = async () => {
      // Only trigger a new sync if:
      // 1. Component is still mounted
      // 2. We're online
      // 3. A sync is not currently in progress
      // 4. Previous sync wasn't successful OR we haven't done an initial sync yet
      if (
        mounted &&
        isOnline &&
        !isSyncInProgressRef.current &&
        (syncStatus !== "success" || !hasPerformedInitialSyncRef.current)
      ) {
        await syncAllTables(hasPerformedInitialSyncRef.current === false); // Force sync on first run
      }
    };

    // When hook is first mounted, delay the initial sync slightly
    if (isOnline && !hasPerformedInitialSyncRef.current) {
      // Clear any existing timeout
      if (initialSyncTimeoutId !== null) {
        clearTimeout(initialSyncTimeoutId);
      }

      // Set a new timeout
      initialSyncTimeoutId = window.setTimeout(() => {
        handleOnlineStatusChange();
        initialSyncTimeoutId = null;
      }, 3000); // 3 second delay for initial sync
    }

    return () => {
      mounted = false;
      if (initialSyncTimeoutId !== null) {
        clearTimeout(initialSyncTimeoutId);
      }
    };
  }, [isOnline, syncAllTables, syncStatus]);

  return {
    syncAllTables,
    syncSpecificTable,
    uploadAndSyncTable,
    syncStatus,
    syncStats,
    error,
    isOnline,
    syncResult,
  };
}
