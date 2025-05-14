import { useState, useEffect, useCallback, useRef } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import { supabase } from "../supabase";
import Database from "@tauri-apps/plugin-sql";

// Tables that need to be synchronized
const TABLES = [
  { name: "coach", primaryKey: "id" }, // Coach must come before athlete due to foreign key
  { name: "athlete", primaryKey: "id" },
  { name: "base_result", primaryKey: "id" },
  { name: "bosco_result", primaryKey: "id" },
  { name: "drop_jump_result", primaryKey: "id" },
  { name: "basic_result", primaryKey: "id" },

  { name: "event", primaryKey: "id" },
  { name: "multiple_drop_jump_result", primaryKey: "id" },
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
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
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

  // Get the last sync time from local storage
  const getLastSyncTime = useCallback(async (): Promise<string> => {
    try {
      const db = await Database.load("sqlite:ergolab.db");
      const result = await db.select(
        "SELECT value FROM sync_meta WHERE key = 'last_sync'"
      );

      if (Array.isArray(result) && result.length > 0) {
        return result[0].value;
      }

      // If no record exists, create one with a default timestamp
      const defaultTime = "1970-01-01T00:00:00.000Z";
      await db.execute(
        "INSERT OR IGNORE INTO sync_meta (key, value) VALUES ('last_sync', ?)",
        [defaultTime]
      );
      return defaultTime;
    } catch (error) {
      console.error("Error getting last sync time:", error);
      return "1970-01-01T00:00:00.000Z"; // Default to epoch start if error
    }
  }, []);

  // Update the last sync time in local storage
  const setLastSyncTimeInDB = useCallback(async (timestamp: string) => {
    try {
      const db = await Database.load("sqlite:ergolab.db");
      await db.execute(
        "UPDATE sync_meta SET value = ? WHERE key = 'last_sync'",
        [timestamp]
      );
    } catch (error) {
      console.error("Error setting last sync time:", error);
    }
  }, []);

  // Ensure sync_meta table exists
  const ensureSyncMetaTable = useCallback(async () => {
    try {
      const db = await Database.load("sqlite:ergolab.db");
      await db.execute(`
        CREATE TABLE IF NOT EXISTS sync_meta (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `);
    } catch (error) {
      console.error("Error creating sync_meta table:", error);
    }
  }, []);

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
    const time1 = new Date(normalizeTimestamp(timestamp1)).getTime();
    const time2 = new Date(normalizeTimestamp(timestamp2)).getTime();
    return time1 > time2;
  };

  // Sync a single table between Supabase and SQLite
  const syncTable = useCallback(
    async (tableName: string, primaryKey: string, lastSync: string) => {
      try {
        console.log(`${tableName}: Opening database connection`);
        const db = await Database.load("sqlite:ergolab.db");
        const tableStats = { uploaded: 0, downloaded: 0 };

        // Add a timeout for this sync operation to prevent hanging
        const syncPromise = (async () => {
          // 1. Pull changes from Supabase that occurred after last sync
          console.log(
            `${tableName}: Fetching changes from Supabase since ${lastSync}`
          );
          const { data: remoteChanges, error: fetchError } = await supabase
            .from(tableName)
            .select("*")
            .gt("last_changed", lastSync);

          if (fetchError)
            throw new Error(
              `Error fetching from Supabase: ${fetchError.message}`
            );

          console.log(
            `${tableName}: Found ${remoteChanges?.length || 0} remote changes`
          );

          // 2. Get local changes that occurred after last sync
          console.log(`${tableName}: Fetching local changes since ${lastSync}`);
          const localChanges = await db.select(
            `SELECT * FROM "${tableName}" WHERE last_changed > ?`,
            [lastSync]
          );

          console.log(
            `${tableName}: Found ${
              Array.isArray(localChanges) ? localChanges.length : 0
            } local changes`
          );

          // 3. Apply remote changes to local database
          if (
            remoteChanges &&
            Array.isArray(remoteChanges) &&
            remoteChanges.length > 0
          ) {
            console.log(
              `${tableName}: Applying remote changes to local database`
            );
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
                    console.log(
                      `${tableName}: Updating local record ${row[primaryKey]} (remote is newer)`
                    );
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
                      console.error(
                        `Error updating local record ${row[primaryKey]} in table ${tableName}:`,
                        updateError
                      );
                      console.error(`Offending row data (remote):`, row);
                      throw updateError;
                    }
                  }
                } else {
                  // Record doesn't exist locally, insert it
                  console.log(
                    `${tableName}: Inserting new remote record ${row[primaryKey]}`
                  );
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
                    console.error(
                      `Error inserting local record ${row[primaryKey]} in table ${tableName}:`,
                      insertError
                    );
                    console.error(`Offending row data (remote):`, row);
                    const errorMessage =
                      insertError instanceof Error
                        ? insertError.message
                        : String(insertError);
                    if (
                      errorMessage.includes("FOREIGN KEY constraint failed")
                    ) {
                      console.error(
                        `${tableName}: Foreign key constraint failed for record ${row[primaryKey]}. This likely means a referenced record doesn't exist yet.`
                      );
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
                  console.error(
                    `Unhandled error processing row ${
                      row ? row[primaryKey] : "unknown"
                    } for table ${tableName} (remote -> local):`,
                    rowError
                  );
                }
                throw rowError;
              }
            }
          }

          // 4. Apply local changes to Supabase
          if (Array.isArray(localChanges) && localChanges.length > 0) {
            console.log(`${tableName}: Applying local changes to Supabase`);
            for (const row of localChanges) {
              try {
                // Check if record exists remotely
                console.log(
                  `${tableName}: Checking if record ${row[primaryKey]} exists in Supabase`
                );
                const { data: existingRemote, error: remoteCheckError } =
                  await supabase
                    .from(tableName)
                    .select(primaryKey)
                    .eq(primaryKey, row[primaryKey])
                    .single();

                if (remoteCheckError && remoteCheckError.code !== "PGRST116") {
                  throw new Error(
                    `Error checking remote record: ${remoteCheckError.message}`
                  );
                }

                if (existingRemote) {
                  // Record exists remotely, get it to compare timestamps
                  console.log(
                    `${tableName}: Record ${row[primaryKey]} exists in Supabase, fetching details`
                  );
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
                    console.log(
                      `${tableName}: Updating Supabase record ${row[primaryKey]} (local is newer)`
                    );
                    try {
                      const { error: updateError } = await supabase
                        .from(tableName)
                        .update(row)
                        .eq(primaryKey, row[primaryKey]);

                      if (updateError) {
                        console.error(
                          `Error updating Supabase record ${row[primaryKey]} in table ${tableName}:`,
                          updateError
                        );
                        console.error(`Offending row data (local):`, row);
                        throw new Error(
                          `Error updating remote record: ${updateError.message}`
                        );
                      }
                      tableStats.uploaded++;
                    } catch (supaUpdateError) {
                      console.error(
                        `Exception during Supabase update for ${tableName} record ${row[primaryKey]}:`,
                        supaUpdateError
                      );
                      throw supaUpdateError;
                    }
                  }
                } else {
                  // Record doesn't exist remotely, insert it
                  console.log(
                    `${tableName}: Inserting new record ${row[primaryKey]} to Supabase`
                  );
                  try {
                    const { error: insertError } = await supabase
                      .from(tableName)
                      .insert(row);

                    if (insertError) {
                      console.error(
                        `Error inserting Supabase record ${row[primaryKey]} in table ${tableName}:`,
                        insertError
                      );
                      console.error(`Offending row data (local):`, row);
                      throw new Error(
                        `Error inserting remote record: ${insertError.message}`
                      );
                    }
                    tableStats.uploaded++;
                  } catch (supaInsertError) {
                    console.error(
                      `Exception during Supabase insert for ${tableName} record ${row[primaryKey]}:`,
                      supaInsertError
                    );
                    throw supaInsertError;
                  }
                }
              } catch (rowProcessingError) {
                console.error(
                  `Unhandled error processing row ${
                    row ? row[primaryKey] : "unknown"
                  } for table ${tableName} (local -> remote):`,
                  rowProcessingError
                );
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
        console.error(`Error syncing table ${tableName}:`, error);
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
        console.log("Sync already in progress, skipping this request");
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
        console.log("Starting database sync...");
        setSyncStatus("syncing");
        setError(null);

        // Ensure sync_meta table exists
        await ensureSyncMetaTable();
        console.log("Sync meta table ready");

        // Get last sync time
        const lastSync = await getLastSyncTime();
        console.log(`Last sync time: ${lastSync}`);

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
          console.log(`Starting sync for table: ${table.name}`);
          try {
            const tableStats = await syncTable(
              table.name,
              table.primaryKey,
              lastSync
            );
            stats.tables[table.name] = tableStats;
            stats.uploaded += tableStats.uploaded;
            stats.downloaded += tableStats.downloaded;
            syncedTables.add(table.name);
            console.log(
              `Completed sync for table ${table.name}: uploaded=${tableStats.uploaded}, downloaded=${tableStats.downloaded}`
            );
          } catch (tableError) {
            const errorMessage =
              tableError instanceof Error
                ? tableError.message
                : String(tableError);
            console.error(`Error syncing table ${table.name}:`, tableError);

            // If it's a foreign key constraint error, add to retry list
            if (
              errorMessage.includes("Foreign key constraint failed") ||
              errorMessage.includes("FOREIGN KEY constraint failed")
            ) {
              console.log(
                `Adding table ${table.name} to retry list due to foreign key constraint error`
              );
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
            console.log(
              `Retry attempt ${retryTable.attempts} for table: ${retryTable.name}`
            );

            try {
              const tableStats = await syncTable(
                retryTable.name,
                retryTable.primaryKey,
                lastSync
              );

              // Success! Add to stats and mark as synced
              stats.tables[retryTable.name] = tableStats;
              stats.uploaded += tableStats.uploaded;
              stats.downloaded += tableStats.downloaded;
              syncedTables.add(retryTable.name);
              progress = true;

              console.log(
                `Completed sync for table ${retryTable.name} on retry attempt ${retryTable.attempts}: uploaded=${tableStats.uploaded}, downloaded=${tableStats.downloaded}`
              );
            } catch (retryError) {
              const errorMessage =
                retryError instanceof Error
                  ? retryError.message
                  : String(retryError);
              console.error(
                `Error on retry ${retryTable.attempts} for table ${retryTable.name}:`,
                retryError
              );

              // If it's still a foreign key error and not at max attempts, keep it in retry list
              if (
                (errorMessage.includes("Foreign key constraint failed") ||
                  errorMessage.includes("FOREIGN KEY constraint failed")) &&
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

        // Update last sync time after sync
        await setLastSyncTimeInDB(now);
        setLastSyncTime(new Date(now));
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

        console.log("Database sync completed:", stats);

        // After sync completes
        isSyncInProgressRef.current = false;
        hasPerformedInitialSyncRef.current = true;
      } catch (error) {
        console.error("Sync error:", error);
        setError(error instanceof Error ? error.message : String(error));
        setSyncStatus("error");
        isSyncInProgressRef.current = false;
      }
    },
    [
      isOnline,
      ensureSyncMetaTable,
      getLastSyncTime,
      setLastSyncTimeInDB,
      syncTable,
    ]
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

        await ensureSyncMetaTable();
        const lastSync = await getLastSyncTime();
        const now = new Date().toISOString();

        const table = TABLES.find((t) => t.name === tableName);
        if (!table) {
          throw new Error(`Table ${tableName} not found in sync configuration`);
        }

        const tableStats = await syncTable(
          table.name,
          table.primaryKey,
          lastSync
        );

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

        await setLastSyncTimeInDB(now);
        setLastSyncTime(new Date(now));
        setSyncStatus("success");
      } catch (error) {
        console.error(`Error syncing table ${tableName}:`, error);
        setError(error instanceof Error ? error.message : String(error));
        setSyncStatus("error");
      } finally {
        isSyncInProgressRef.current = false;
      }
    },
    [
      isOnline,
      ensureSyncMetaTable,
      getLastSyncTime,
      setLastSyncTimeInDB,
      syncTable,
    ]
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
    lastSyncTime,
    syncStats,
    error,
    isOnline,
  };
}
