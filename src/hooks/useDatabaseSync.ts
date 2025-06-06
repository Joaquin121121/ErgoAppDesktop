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
  // Training data tables - order matters for foreign keys
  { name: "exercises", primaryKey: "id" }, // Exercises must come before selected_exercises
  { name: "training_plans", primaryKey: "id" }, // Training plans must come before sessions and models
  { name: "training_models", primaryKey: "id" }, // Models reference training_plans
  { name: "training_plan_models", primaryKey: "training_plan_id" }, // Junction table - using training_plan_id as primary for sync (composite key handled specially)
  { name: "sessions", primaryKey: "id" }, // Sessions reference training_plans
  { name: "session_days", primaryKey: "id" }, // Session days reference sessions
  { name: "training_blocks", primaryKey: "id" }, // Training blocks reference sessions
  { name: "selected_exercises", primaryKey: "id" }, // Selected exercises reference sessions, exercises, and training_blocks
  { name: "progressions", primaryKey: "id" }, // Progressions reference selected_exercises or training_blocks
  { name: "volume_reductions", primaryKey: "id" }, // Volume reductions reference selected_exercises or training_blocks
  { name: "effort_reductions", primaryKey: "id" }, // Effort reductions reference selected_exercises or training_blocks
];

type SyncStatus = "idle" | "syncing" | "success" | "error";

interface SyncStats {
  uploaded: number;
  downloaded: number;
  conflicts: number;
  tables: Record<string, { uploaded: number; downloaded: number }>;
  errors: { table: string; error: string }[];
}

// Sync metadata interface
interface SyncMetadata {
  [tableName: string]: string; // ISO timestamp of last sync
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
  const [loading, setLoading] = useState<boolean>(false);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false); // Add flag to prevent sync during data loading

  // Add a ref to track if sync is in progress to prevent concurrent syncs
  const isSyncInProgressRef = useRef(false);
  // Track if we've done the initial sync
  const hasPerformedInitialSyncRef = useRef(false);

  const lastSyncAttemptTimeRef = useRef<number>(0);

  // Sync metadata management
  const SYNC_METADATA_KEY = "ergolab_sync_metadata";

  const getSyncMetadata = (): SyncMetadata => {
    try {
      const stored = localStorage.getItem(SYNC_METADATA_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn("Failed to load sync metadata from localStorage:", error);
      return {};
    }
  };

  const setSyncMetadata = (metadata: SyncMetadata): void => {
    try {
      localStorage.setItem(SYNC_METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error("Failed to save sync metadata to localStorage:", error);
    }
  };

  const updateTableSyncMetadata = (
    tableName: string,
    timestamp: string
  ): void => {
    const metadata = getSyncMetadata();
    metadata[tableName] = timestamp;
    setSyncMetadata(metadata);
    console.log(`📝 Updated sync metadata for ${tableName}: ${timestamp}`);
  };

  // Get the latest timestamp from a dataset
  const getLatestTimestamp = (data: any[]): string | null => {
    if (!Array.isArray(data) || data.length === 0) return null;

    return data.reduce((latest, row) => {
      if (!row.last_changed) return latest;

      const rowTimestamp = normalizeTimestamp(row.last_changed);
      if (!latest) return rowTimestamp;

      return isTimestampNewer(rowTimestamp, latest) ? rowTimestamp : latest;
    }, null as string | null);
  };

  // Check if table needs syncing based on metadata
  const shouldSyncTable = async (tableName: string): Promise<boolean> => {
    try {
      const metadata = getSyncMetadata();
      const lastSyncTime = metadata[tableName];

      if (!lastSyncTime) {
        console.log(`🔍 Table ${tableName} has no sync metadata - needs sync`);
        return true;
      }

      console.log(
        `🔍 Checking if ${tableName} needs sync (last sync: ${lastSyncTime})`
      );

      // Check remote data for changes since last sync
      const { data: remoteData, error: fetchError } = await supabase
        .from(tableName)
        .select("last_changed")
        .gt("last_changed", lastSyncTime)
        .limit(1);

      if (fetchError) {
        console.warn(
          `Warning: Could not check remote changes for ${tableName}:`,
          fetchError
        );
        return true; // Sync on error to be safe
      }

      const hasRemoteChanges = remoteData && remoteData.length > 0;
      if (hasRemoteChanges) {
        console.log(`📥 Table ${tableName} has remote changes since last sync`);
        return true;
      }

      // Check local data for changes since last sync
      const db = await Database.load("sqlite:ergolab.db");
      const localData = await db.select(
        `SELECT last_changed FROM "${tableName}" WHERE last_changed > ? LIMIT 1`,
        [lastSyncTime]
      );

      const hasLocalChanges = Array.isArray(localData) && localData.length > 0;
      if (hasLocalChanges) {
        console.log(`📤 Table ${tableName} has local changes since last sync`);
        return true;
      }

      console.log(
        `⏭️ Table ${tableName} has no changes since last sync - skipping`
      );
      return false;
    } catch (error) {
      console.warn(
        `Warning: Could not check sync necessity for ${tableName}:`,
        error
      );
      return true; // Sync on error to be safe
    }
  };

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
    async (
      tableName: string,
      primaryKey: string,
      forceSync: boolean = false
    ) => {
      console.log(`🔄 Starting sync for table: ${tableName}`);
      const tableStartTime = Date.now();

      try {
        // Check if sync is needed based on metadata (unless forced)
        if (!forceSync) {
          const needsSync = await shouldSyncTable(tableName);
          if (!needsSync) {
            console.log(`⏭️ Skipping ${tableName} - no changes detected`);
            return { uploaded: 0, downloaded: 0 };
          }
        } else {
          console.log(
            `🔒 Force syncing ${tableName} - metadata check bypassed`
          );
        }

        const db = await Database.load("sqlite:ergolab.db");
        const tableStats = { uploaded: 0, downloaded: 0 };

        // Get last sync metadata for incremental sync
        const metadata = getSyncMetadata();
        const lastSyncTime = metadata[tableName];
        const isFirstSync = !lastSyncTime;

        console.log(
          `🔍 Sync type for ${tableName}: ${
            isFirstSync
              ? "FULL (first sync)"
              : `INCREMENTAL (since ${lastSyncTime})`
          }`
        );

        // Add a timeout for this sync operation to prevent hanging
        const syncPromise = (async () => {
          // 1. Pull changes from Supabase (incremental)
          console.log(
            `📥 Fetching ${
              isFirstSync ? "all" : "changed"
            } remote data from Supabase for table: ${tableName}`
          );

          let remoteQuery = supabase.from(tableName).select("*");

          // Apply incremental filter if not first sync
          if (!isFirstSync) {
            remoteQuery = remoteQuery.gt("last_changed", lastSyncTime);
          }

          const { data: remoteChanges, error: fetchError } = await remoteQuery;

          if (fetchError)
            throw new Error(
              `Error fetching from Supabase: ${fetchError.message}`
            );

          console.log(
            `📥 Found ${remoteChanges?.length || 0} ${
              isFirstSync ? "total" : "changed"
            } remote records for table: ${tableName}`
          );

          // 2. Get local changes (incremental)
          console.log(
            `📤 Fetching ${
              isFirstSync ? "all" : "changed"
            } local data from SQLite for table: ${tableName}`
          );

          let localChanges;
          if (isFirstSync) {
            // First sync - get all local records
            localChanges = await db.select(`SELECT * FROM "${tableName}"`);
          } else {
            // Incremental sync - only get records changed since last sync
            localChanges = await db.select(
              `SELECT * FROM "${tableName}" WHERE last_changed > ?`,
              [lastSyncTime]
            );
          }

          console.log(
            `📤 Found ${
              Array.isArray(localChanges) ? localChanges.length : 0
            } ${
              isFirstSync ? "total" : "changed"
            } local records for table: ${tableName}`
          );

          // 3. Apply remote changes to local database
          if (
            remoteChanges &&
            Array.isArray(remoteChanges) &&
            remoteChanges.length > 0
          ) {
            console.log(
              `🔄 Processing ${remoteChanges.length} remote records for table: ${tableName}`
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
                      `⬇️ Updating local record ${row[primaryKey]} in table: ${tableName} (remote is newer)`
                    );
                    const columns = Object.keys(row).filter(
                      (k) => k !== primaryKey
                    );
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
                        `❌ Error updating local record ${row[primaryKey]} in table: ${tableName}:`,
                        updateError
                      );
                      throw updateError;
                    }
                  } else {
                    console.log(
                      `⏭️ Skipping local record ${row[primaryKey]} in table: ${tableName} (local is newer or same)`
                    );
                  }
                } else {
                  // Record doesn't exist locally, insert it
                  console.log(
                    `⬇️ Inserting new local record ${row[primaryKey]} in table: ${tableName}`
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
                    const errorMessage =
                      insertError instanceof Error
                        ? insertError.message
                        : String(insertError);
                    console.error(
                      `❌ Error inserting record ${row[primaryKey]} in table: ${tableName}:`,
                      errorMessage
                    );
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
                console.error(
                  `❌ Error processing remote record ${row[primaryKey]} in table: ${tableName}:`,
                  errorMessage
                );
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

          // 4. Push local changes to Supabase
          if (Array.isArray(localChanges) && localChanges.length > 0) {
            console.log(
              `🔼 Processing ${localChanges.length} local records for upload to table: ${tableName}`
            );
            for (const row of localChanges) {
              try {
                // For incremental sync, we can assume the record needs to be uploaded
                // since we only fetched records that changed since last sync
                // But we still need to check if it exists remotely to decide insert vs update

                console.log(
                  `🔍 Checking if record ${row[primaryKey]} exists remotely in table: ${tableName}`
                );
                const { data: existingRemote, error: checkError } =
                  await supabase
                    .from(tableName)
                    .select(`${primaryKey}, last_changed`)
                    .eq(primaryKey, row[primaryKey])
                    .maybeSingle();

                if (checkError && checkError.code !== "PGRST116") {
                  console.error(
                    `❌ Error checking remote record ${row[primaryKey]} in table: ${tableName}:`,
                    checkError
                  );
                  throw new Error(
                    `Error checking remote record: ${checkError.message}`
                  );
                }

                if (existingRemote) {
                  // Record exists remotely, compare timestamps
                  if (
                    isTimestampNewer(
                      row.last_changed,
                      (existingRemote as any).last_changed
                    )
                  ) {
                    // Local is newer, update remote
                    console.log(
                      `⬆️ Updating remote record ${row[primaryKey]} in table: ${tableName} (local is newer)`
                    );
                    try {
                      const { error: updateError } = await supabase
                        .from(tableName)
                        .update(row)
                        .eq(primaryKey, row[primaryKey]);

                      if (updateError) {
                        console.error(
                          `❌ Error updating remote record ${row[primaryKey]} in table: ${tableName}:`,
                          updateError
                        );
                        throw new Error(
                          `Error updating remote record: ${updateError.message}`
                        );
                      }
                      tableStats.uploaded++;
                    } catch (supaUpdateError) {
                      console.error(
                        `❌ Error in Supabase update for record ${row[primaryKey]} in table: ${tableName}:`,
                        supaUpdateError
                      );
                      throw supaUpdateError;
                    }
                  } else {
                    console.log(
                      `⏭️ Skipping remote record ${row[primaryKey]} in table: ${tableName} (remote is newer or same)`
                    );
                  }
                } else {
                  // Record doesn't exist remotely, insert it
                  console.log(
                    `⬆️ Inserting new remote record ${row[primaryKey]} in table: ${tableName}`
                  );

                  // Special handling for foreign key constraints

                  // Training models - check if referenced training_plan exists
                  if (tableName === "training_models" && row.training_plan_id) {
                    console.log(
                      `🔍 Checking if training plan ${row.training_plan_id} exists for training model ${row[primaryKey]}`
                    );

                    const { data: planExists, error: planCheckError } =
                      await supabase
                        .from("training_plans")
                        .select("id")
                        .eq("id", row.training_plan_id)
                        .maybeSingle();

                    if (planCheckError && planCheckError.code !== "PGRST116") {
                      console.error(
                        `❌ Error checking training plan existence for ${row[primaryKey]}:`,
                        planCheckError
                      );
                      throw new Error(
                        `Error checking training plan: ${planCheckError.message}`
                      );
                    }

                    if (!planExists) {
                      console.warn(
                        `⚠️ Training plan ${row.training_plan_id} not found remotely for training model ${row[primaryKey]}. Skipping this record and will retry in next sync.`
                      );
                      // Skip this record - it will be retried in the next sync after the training plan is synced
                      continue;
                    }
                  }

                  // Sessions - check if referenced training_plan exists (plan_id field)
                  if (tableName === "sessions" && row.plan_id) {
                    console.log(
                      `🔍 Checking if training plan ${row.plan_id} exists for session ${row[primaryKey]}`
                    );

                    const { data: planExists, error: planCheckError } =
                      await supabase
                        .from("training_plans")
                        .select("id")
                        .eq("id", row.plan_id)
                        .maybeSingle();

                    if (planCheckError && planCheckError.code !== "PGRST116") {
                      console.error(
                        `❌ Error checking training plan existence for session ${row[primaryKey]}:`,
                        planCheckError
                      );
                      throw new Error(
                        `Error checking training plan: ${planCheckError.message}`
                      );
                    }

                    if (!planExists) {
                      console.warn(
                        `⚠️ Training plan ${row.plan_id} not found remotely for session ${row[primaryKey]}. Skipping this record and will retry in next sync.`
                      );
                      continue;
                    }
                  }

                  // Session days - check if referenced session exists
                  if (tableName === "session_days" && row.session_id) {
                    console.log(
                      `🔍 Checking if session ${row.session_id} exists for session_day ${row[primaryKey]}`
                    );

                    const { data: sessionExists, error: sessionCheckError } =
                      await supabase
                        .from("sessions")
                        .select("id")
                        .eq("id", row.session_id)
                        .maybeSingle();

                    if (
                      sessionCheckError &&
                      sessionCheckError.code !== "PGRST116"
                    ) {
                      console.error(
                        `❌ Error checking session existence for session_day ${row[primaryKey]}:`,
                        sessionCheckError
                      );
                      throw new Error(
                        `Error checking session: ${sessionCheckError.message}`
                      );
                    }

                    if (!sessionExists) {
                      console.warn(
                        `⚠️ Session ${row.session_id} not found remotely for session_day ${row[primaryKey]}. Skipping this record and will retry in next sync.`
                      );
                      continue;
                    }
                  }

                  // Training blocks - check if referenced session exists
                  if (tableName === "training_blocks" && row.session_id) {
                    console.log(
                      `🔍 Checking if session ${row.session_id} exists for training_block ${row[primaryKey]}`
                    );

                    const { data: sessionExists, error: sessionCheckError } =
                      await supabase
                        .from("sessions")
                        .select("id")
                        .eq("id", row.session_id)
                        .maybeSingle();

                    if (
                      sessionCheckError &&
                      sessionCheckError.code !== "PGRST116"
                    ) {
                      console.error(
                        `❌ Error checking session existence for training_block ${row[primaryKey]}:`,
                        sessionCheckError
                      );
                      throw new Error(
                        `Error checking session: ${sessionCheckError.message}`
                      );
                    }

                    if (!sessionExists) {
                      console.warn(
                        `⚠️ Session ${row.session_id} not found remotely for training_block ${row[primaryKey]}. Skipping this record and will retry in next sync.`
                      );
                      continue;
                    }
                  }

                  // Selected exercises - check if referenced session and exercise exist
                  if (tableName === "selected_exercises") {
                    if (row.session_id) {
                      const { data: sessionExists, error: sessionCheckError } =
                        await supabase
                          .from("sessions")
                          .select("id")
                          .eq("id", row.session_id)
                          .maybeSingle();

                      if (
                        sessionCheckError &&
                        sessionCheckError.code !== "PGRST116"
                      ) {
                        console.error(
                          `❌ Error checking session existence for selected_exercise ${row[primaryKey]}:`,
                          sessionCheckError
                        );
                        throw new Error(
                          `Error checking session: ${sessionCheckError.message}`
                        );
                      }

                      if (!sessionExists) {
                        console.warn(
                          `⚠️ Session ${row.session_id} not found remotely for selected_exercise ${row[primaryKey]}. Skipping this record and will retry in next sync.`
                        );
                        continue;
                      }
                    }

                    if (row.exercise_id) {
                      const {
                        data: exerciseExists,
                        error: exerciseCheckError,
                      } = await supabase
                        .from("exercises")
                        .select("id")
                        .eq("id", row.exercise_id)
                        .maybeSingle();

                      if (
                        exerciseCheckError &&
                        exerciseCheckError.code !== "PGRST116"
                      ) {
                        console.error(
                          `❌ Error checking exercise existence for selected_exercise ${row[primaryKey]}:`,
                          exerciseCheckError
                        );
                        throw new Error(
                          `Error checking exercise: ${exerciseCheckError.message}`
                        );
                      }

                      if (!exerciseExists) {
                        console.warn(
                          `⚠️ Exercise ${row.exercise_id} not found remotely for selected_exercise ${row[primaryKey]}. Skipping this record and will retry in next sync.`
                        );
                        continue;
                      }
                    }
                  }

                  try {
                    const { error: insertError } = await supabase
                      .from(tableName)
                      .insert(row);

                    if (insertError) {
                      console.error(
                        `❌ Error inserting remote record ${row[primaryKey]} in table: ${tableName}:`,
                        insertError
                      );
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
                    console.error(
                      `❌ Error in Supabase insert for record ${row[primaryKey]} in table: ${tableName}:`,
                      supaInsertError
                    );
                    throw supaInsertError;
                  }
                }
              } catch (rowProcessingError) {
                console.error(
                  `❌ Error processing local record ${row[primaryKey]} in table: ${tableName}:`,
                  rowProcessingError
                );
                throw rowProcessingError;
              }
            }
          }

          const tableEndTime = Date.now();
          const tableDuration = tableEndTime - tableStartTime;

          // Update sync metadata after successful sync
          const currentTime = new Date().toISOString();

          // Determine the latest timestamp from both datasets to store as sync metadata
          const remoteLatest = getLatestTimestamp(remoteChanges || []);
          const localLatest = getLatestTimestamp(
            Array.isArray(localChanges) ? localChanges : []
          );

          let syncTimestamp = currentTime;
          if (remoteLatest && localLatest) {
            syncTimestamp = isTimestampNewer(remoteLatest, localLatest)
              ? remoteLatest
              : localLatest;
          } else if (remoteLatest) {
            syncTimestamp = remoteLatest;
          } else if (localLatest) {
            syncTimestamp = localLatest;
          }

          updateTableSyncMetadata(tableName, syncTimestamp);

          console.log(
            `✅ Table ${tableName} sync completed in ${tableDuration}ms - Downloaded: ${tableStats.downloaded}, Uploaded: ${tableStats.uploaded}`
          );

          return tableStats;
        })();

        // Set a timeout to prevent indefinite hanging and properly manage cleanup
        let timeoutId: NodeJS.Timeout | null = null;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            console.error(
              `⏰ Sync timeout for table ${tableName} after 30 seconds`
            );
            reject(new Error(`Sync timeout for table ${tableName}`));
          }, 30000); // 30 second timeout
        });

        // Race the sync operation against the timeout
        try {
          const result = await Promise.race([syncPromise, timeoutPromise]);
          // Clear timeout on successful completion
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          return result as { uploaded: number; downloaded: number };
        } catch (error) {
          // Clear timeout on error
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          throw error;
        }
      } catch (error) {
        const tableEndTime = Date.now();
        const tableDuration = tableEndTime - tableStartTime;
        console.error(
          `❌ Table ${tableName} sync failed after ${tableDuration}ms:`,
          error
        );
        throw error;
      }
    },
    [
      isTimestampNewer,
      shouldSyncTable,
      getLatestTimestamp,
      updateTableSyncMetadata,
      getSyncMetadata,
    ]
  );

  // Main sync function that syncs all tables
  const syncAllTables = useCallback(
    async (force: boolean = false) => {
      const now = Date.now();

      // Prevent multiple syncs from running at the same time
      if (isSyncInProgressRef.current) {
        return;
      }

      // Prevent sync during data loading operations
      if (isDataLoading) {
        console.log("⚠️ Skipping sync - data loading in progress");
        return;
      }

      // Update last attempt time
      lastSyncAttemptTimeRef.current = now;

      if (!isOnline) {
        setError("Cannot sync while offline");
        setSyncStatus("error");
        return;
      }

      console.log(`🔄 Starting ${force ? "forced " : ""}sync of all tables...`);
      const allTablesStartTime = Date.now();

      try {
        // Set flag to indicate sync is in progress
        isSyncInProgressRef.current = true;
        setLoading(true);
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
            let tableStats;

            // Remove the special skipping logic for training_models
            // Let training_models sync normally with foreign key checks

            // Special handling for junction tables with composite keys
            if (table.name === "training_plan_models") {
              // TODO: Implement proper composite key sync for junction tables
              // For now, using training_plan_id as primary key will work but may miss some edge cases
              console.log(
                `⚠️ Syncing ${table.name} - composite key table using partial key`
              );
            }

            // Use regular sync for all tables
            tableStats = await syncTable(table.name, table.primaryKey, force);

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
              // Use regular sync for all tables during retry
              const tableStats = await syncTable(
                retryTable.name,
                retryTable.primaryKey,
                force
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

        const allTablesEndTime = Date.now();
        const allTablesDuration = allTablesEndTime - allTablesStartTime;

        // Set appropriate status based on whether there were any errors
        if (stats.errors.length > 0) {
          setSyncStatus("error");
          setError(
            `Sync completed with errors in tables: ${stats.errors
              .map((e) => e.table)
              .join(", ")}`
          );
          console.error(
            `❌ All tables sync completed with errors in ${allTablesDuration}ms`
          );
        } else {
          setSyncStatus("success");
          console.log(
            `🎉 All tables sync completed successfully in ${allTablesDuration}ms`
          );
        }

        // After sync completes
        isSyncInProgressRef.current = false;
        setLoading(false);
        hasPerformedInitialSyncRef.current = true;
      } catch (error) {
        const allTablesEndTime = Date.now();
        const allTablesDuration = allTablesEndTime - allTablesStartTime;
        console.error(
          `❌ All tables sync failed after ${allTablesDuration}ms:`,
          error
        );
        setError(error instanceof Error ? error.message : String(error));
        setSyncStatus("error");
        isSyncInProgressRef.current = false;
        setLoading(false);
      }
    },
    [isOnline, syncTable]
  );

  // Function to sync a specific table
  const syncSpecificTable = useCallback(
    async (tableName: string, force: boolean = false) => {
      console.log(
        `🎯 Starting specific table sync for: ${tableName}${
          force ? " (forced)" : ""
        }`
      );
      const specificTableStartTime = Date.now();
      const now = Date.now();

      if (isSyncInProgressRef.current) {
        console.log("⚠️ Sync already in progress, skipping this request");
        return;
      }

      if (!isOnline) {
        console.error(`❌ Cannot sync ${tableName} while offline`);
        setError("Cannot sync while offline");
        setSyncStatus("error");
        return;
      }

      try {
        isSyncInProgressRef.current = true;
        setLoading(true);
        setSyncStatus("syncing");
        setError(null);

        const now = new Date().toISOString();

        const table = TABLES.find((t) => t.name === tableName);
        if (!table) {
          throw new Error(`Table ${tableName} not found in sync configuration`);
        }

        console.log(
          `🔄 Syncing table ${tableName} with primary key: ${table.primaryKey}`
        );
        const tableStats = await syncTable(table.name, table.primaryKey, force);

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

        const specificTableEndTime = Date.now();
        const specificTableDuration =
          specificTableEndTime - specificTableStartTime;
        console.log(
          `✅ Specific table sync for ${tableName} completed successfully in ${specificTableDuration}ms`
        );
        setSyncStatus("success");
      } catch (error) {
        const specificTableEndTime = Date.now();
        const specificTableDuration =
          specificTableEndTime - specificTableStartTime;
        console.error(
          `❌ Specific table sync for ${tableName} failed after ${specificTableDuration}ms:`,
          error
        );
        setError(error instanceof Error ? error.message : String(error));
        setSyncStatus("error");
      } finally {
        isSyncInProgressRef.current = false;
        setLoading(false);
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

  // Sync all training plan related tables
  const syncTrainingPlans = async () => {
    console.log("🔄 Starting training plans sync...");
    const startTime = Date.now();

    try {
      // Sync in order due to foreign key dependencies
      console.log("📋 Syncing exercises table...");
      await syncSpecificTable("exercises");
      console.log("✅ Exercises table synced successfully");

      // Sync training_plans normally
      console.log("📋 Syncing training_plans table...");
      await syncTable("training_plans", "id");
      console.log("✅ Training plans table synced successfully");

      console.log("📋 Syncing training_models table...");
      await syncSpecificTable("training_models");
      console.log("✅ Training models table synced successfully");

      // No need to update model_id values anymore with the new structure

      console.log("📋 Syncing sessions table...");
      await syncSpecificTable("sessions");
      console.log("✅ Sessions table synced successfully");

      console.log("📋 Syncing session_days table...");
      await syncSpecificTable("session_days");
      console.log("✅ Session days table synced successfully");

      console.log("📋 Syncing training_blocks table...");
      await syncSpecificTable("training_blocks");
      console.log("✅ Training blocks table synced successfully");

      console.log("📋 Syncing selected_exercises table...");
      await syncSpecificTable("selected_exercises");
      console.log("✅ Selected exercises table synced successfully");

      console.log("📋 Syncing progressions table...");
      await syncSpecificTable("progressions");
      console.log("✅ Progressions table synced successfully");

      console.log("📋 Syncing volume_reductions table...");
      await syncSpecificTable("volume_reductions");
      console.log("✅ Volume reductions table synced successfully");

      console.log("📋 Syncing effort_reductions table...");
      await syncSpecificTable("effort_reductions");
      console.log("✅ Effort reductions table synced successfully");

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(
        `🎉 Training plans sync completed successfully in ${duration}ms`
      );
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.error(
        `❌ Training plans sync failed after ${duration}ms:`,
        error
      );
      throw error;
    }
  };

  // Sync only training models and their dependencies
  const syncTrainingModels = async () => {
    console.log("🔄 Starting training models sync...");
    const startTime = Date.now();

    try {
      console.log(
        "📋 Syncing exercises table (dependency for training models)..."
      );
      await syncSpecificTable("exercises");
      console.log("✅ Exercises table synced successfully");

      console.log(
        "📋 Syncing training_plans table (dependency for training models)..."
      );
      await syncSpecificTable("training_plans");
      console.log("✅ Training plans table synced successfully");

      console.log("📋 Syncing training_models table...");
      await syncSpecificTable("training_models");
      console.log("✅ Training models table synced successfully");

      console.log("📋 Syncing training_plan_models relationship table...");
      await syncSpecificTable("training_plan_models");
      console.log(
        "✅ Training plan models relationship table synced successfully"
      );

      console.log("📋 Syncing sessions table...");
      await syncSpecificTable("sessions");
      console.log("✅ Sessions table synced successfully");

      console.log("📋 Syncing session_days table...");
      await syncSpecificTable("session_days");
      console.log("✅ Session days table synced successfully");

      console.log("📋 Syncing training_blocks table...");
      await syncSpecificTable("training_blocks");
      console.log("✅ Training blocks table synced successfully");

      console.log("📋 Syncing selected_exercises table...");
      await syncSpecificTable("selected_exercises");
      console.log("✅ Selected exercises table synced successfully");

      console.log("📋 Syncing progressions table...");
      await syncSpecificTable("progressions");
      console.log("✅ Progressions table synced successfully");

      console.log("📋 Syncing volume_reductions table...");
      await syncSpecificTable("volume_reductions");
      console.log("✅ Volume reductions table synced successfully");

      console.log("📋 Syncing effort_reductions table...");
      await syncSpecificTable("effort_reductions");
      console.log("✅ Effort reductions table synced successfully");

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(
        `🎉 Training models sync completed successfully in ${duration}ms`
      );
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.error(
        `❌ Training models sync failed after ${duration}ms:`,
        error
      );
      throw error;
    }
  };

  // Sync only exercises
  const syncExercises = async () => {
    await syncSpecificTable("exercises");
  };

  // Sync all training data for a specific user
  const syncUserTrainingData = async (userId: string) => {
    try {
      setLoading(true);
      setSyncStatus("syncing");
      setError(null);

      // For user-specific training data, we need to sync all related tables
      // since the filtering happens at the application level, not the sync level
      await syncTrainingPlans();

      setSyncStatus("success");
    } catch (error) {
      console.error("Error syncing user training data:", error);
      setError(error instanceof Error ? error.message : String(error));
      setSyncStatus("error");
    } finally {
      setLoading(false);
    }
  };

  // Function to manually trigger initial sync (prevents automatic sync on mount)
  const startInitialSync = useCallback(
    async (force: boolean = false) => {
      if (isSyncInProgressRef.current) {
        console.log("⚠️ Sync already in progress, skipping manual start");
        return;
      }

      if (!isOnline) {
        console.log("⚠️ Cannot start sync while offline");
        setError("Cannot sync while offline");
        setSyncStatus("error");
        return;
      }

      console.log("🚀 Manually starting initial sync...");
      await syncAllTables(force || !hasPerformedInitialSyncRef.current);
    },
    [isOnline, syncAllTables]
  );

  // Reset sync metadata (useful for debugging or force full sync)
  const resetSyncMetadata = (): void => {
    try {
      localStorage.removeItem(SYNC_METADATA_KEY);
      console.log("🗑️ Sync metadata cleared from localStorage");
    } catch (error) {
      console.error("Failed to clear sync metadata:", error);
    }
  };

  // Get current sync metadata for debugging
  const getCurrentSyncMetadata = (): SyncMetadata => {
    return getSyncMetadata();
  };

  // Record-level sync functions
  const syncSingleRecord = useCallback(
    async (
      tableName: string,
      recordId: string,
      operation: "insert" | "update" | "delete",
      data?: any
    ): Promise<boolean> => {
      if (!isOnline) {
        console.log(
          `⚠️ Cannot sync record ${tableName}:${recordId} while offline`
        );
        return false;
      }

      try {
        console.log(`🔄 Syncing ${operation} for ${tableName}:${recordId}`);

        switch (operation) {
          case "insert":
            const { error: insertError } = await supabase
              .from(tableName)
              .insert(data);

            if (insertError) {
              throw new Error(`Insert failed: ${insertError.message}`);
            }
            break;

          case "update":
            // Check if record exists remotely first
            const { data: existing, error: checkError } = await supabase
              .from(tableName)
              .select("id, last_changed")
              .eq("id", recordId)
              .maybeSingle();

            if (checkError && checkError.code !== "PGRST116") {
              throw new Error(`Check failed: ${checkError.message}`);
            }

            if (existing) {
              // Update existing record
              const { error: updateError } = await supabase
                .from(tableName)
                .update(data)
                .eq("id", recordId);

              if (updateError) {
                throw new Error(`Update failed: ${updateError.message}`);
              }
            } else {
              // Record doesn't exist, insert it
              const { error: insertError } = await supabase
                .from(tableName)
                .insert({ ...data, id: recordId });

              if (insertError) {
                throw new Error(`Insert failed: ${insertError.message}`);
              }
            }
            break;

          case "delete":
            // Soft delete by updating deleted_at
            const { error: deleteError } = await supabase
              .from(tableName)
              .update({
                deleted_at: new Date().toISOString(),
                last_changed: new Date().toISOString(),
              })
              .eq("id", recordId);

            if (deleteError) {
              throw new Error(`Delete failed: ${deleteError.message}`);
            }
            break;
        }

        console.log(
          `✅ Successfully synced ${operation} for ${tableName}:${recordId}`
        );
        return true;
      } catch (error) {
        console.error(
          `❌ Failed to sync ${operation} for ${tableName}:${recordId}:`,
          error
        );
        return false;
      }
    },
    [isOnline]
  );

  // Batch sync multiple records
  const syncRecordBatch = useCallback(
    async (
      records: Array<{
        tableName: string;
        recordId: string;
        operation: "insert" | "update" | "delete";
        data?: any;
      }>
    ): Promise<{ successful: number; failed: number }> => {
      if (!isOnline) {
        console.log(`⚠️ Cannot sync record batch while offline`);
        return { successful: 0, failed: records.length };
      }

      console.log(`🔄 Syncing batch of ${records.length} records`);

      const results = await Promise.allSettled(
        records.map((record) =>
          syncSingleRecord(
            record.tableName,
            record.recordId,
            record.operation,
            record.data
          )
        )
      );

      let successful = 0;
      let failed = 0;

      results.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value === true) {
          successful++;
        } else {
          failed++;
          console.error(
            `❌ Failed to sync record ${records[index].tableName}:${records[index].recordId}`
          );
        }
      });

      console.log(
        `📊 Batch sync completed: ${successful} successful, ${failed} failed`
      );
      return { successful, failed };
    },
    [syncSingleRecord, isOnline]
  );

  // Functions to control data loading state
  const setDataLoadingState = useCallback((loading: boolean) => {
    console.log(`🔄 Data loading state: ${loading ? "START" : "END"}`);
    setIsDataLoading(loading);
  }, []);

  const withDataLoading = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      setDataLoadingState(true);
      try {
        const result = await operation();
        return result;
      } finally {
        setDataLoadingState(false);
      }
    },
    [setDataLoadingState]
  );

  return {
    syncAllTables,
    syncSpecificTable,
    uploadAndSyncTable,
    startInitialSync,
    syncStatus,
    syncStats,
    error,
    isOnline,
    loading,
    syncResult,
    // Training data sync functions
    syncTrainingPlans,
    syncTrainingModels,
    syncExercises,
    syncUserTrainingData,
    // Sync metadata functions
    resetSyncMetadata,
    getCurrentSyncMetadata,
    // Record-level sync functions
    syncSingleRecord,
    syncRecordBatch,
    // Functions to control data loading state
    setDataLoadingState,
    withDataLoading,
  };
}
