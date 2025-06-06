import { useState, useEffect, useCallback, useRef } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import { supabase } from "../supabase";
import Database from "@tauri-apps/plugin-sql";

// Types for record-level sync
export interface RecordChange {
  id: string; // Unique ID for this change
  tableName: string;
  recordId: string;
  operation: "insert" | "update" | "delete";
  data?: any;
  priority: SyncPriority;
  timestamp: string;
  retryCount: number;
}

export enum SyncPriority {
  CRITICAL = 1, // Save operations, deletions - sync immediately
  HIGH = 2, // Content changes - sync within 5 seconds
  MEDIUM = 3, // Metadata changes - sync within 30 seconds
  LOW = 4, // UI state, preferences - sync within 5 minutes
}

interface SyncStats {
  totalChanges: number;
  successfulSyncs: number;
  failedSyncs: number;
  pendingChanges: number;
}

interface RecordSyncOptions {
  maxRetries?: number;
  batchSize?: number;
  syncIntervals?: {
    [SyncPriority.CRITICAL]: number;
    [SyncPriority.HIGH]: number;
    [SyncPriority.MEDIUM]: number;
    [SyncPriority.LOW]: number;
  };
}

const DEFAULT_OPTIONS: Required<RecordSyncOptions> = {
  maxRetries: 3,
  batchSize: 10,
  syncIntervals: {
    [SyncPriority.CRITICAL]: 0, // Immediate
    [SyncPriority.HIGH]: 5000, // 5 seconds
    [SyncPriority.MEDIUM]: 30000, // 30 seconds
    [SyncPriority.LOW]: 300000, // 5 minutes
  },
};

export function useRecordSync(options: RecordSyncOptions = {}) {
  const { isOnline } = useOnlineStatus();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // State
  const [changeQueue, setChangeQueue] = useState<RecordChange[]>([]);
  const [syncStats, setSyncStats] = useState<SyncStats>({
    totalChanges: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    pendingChanges: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Functions to control sync behavior
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false); // Default to disabled to prevent automatic sync on load
  const [dataSyncDisabled, setDataSyncDisabled] = useState(false);

  // Refs for debounced operations
  const syncTimeouts = useRef<Map<SyncPriority, NodeJS.Timeout>>(new Map());
  const processedChangeIds = useRef<Set<string>>(new Set());

  // Generate unique change ID
  const generateChangeId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Queue a record change for sync
  const queueRecordChange = useCallback(
    (
      tableName: string,
      recordId: string,
      operation: "insert" | "update" | "delete",
      data?: any,
      priority: SyncPriority = SyncPriority.MEDIUM
    ) => {
      const changeId = generateChangeId();
      const change: RecordChange = {
        id: changeId,
        tableName,
        recordId,
        operation,
        data,
        priority,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };

      console.log(
        `📝 Queuing ${operation} for ${tableName}:${recordId} (Priority: ${SyncPriority[priority]})`
      );

      setChangeQueue((prev) => {
        // Remove any existing changes for the same record to avoid duplicates
        const filtered = prev.filter(
          (c) => !(c.tableName === tableName && c.recordId === recordId)
        );
        return [...filtered, change];
      });

      // Schedule sync based on priority
      scheduleSync(priority);

      return changeId;
    },
    []
  );

  // Modified schedule sync to check if sync is disabled
  const scheduleSync = useCallback(
    (priority: SyncPriority) => {
      if (dataSyncDisabled) {
        console.log(
          `⚠️ Sync disabled for priority ${SyncPriority[priority]} - data loading in progress`
        );
        return;
      }

      const delay = opts.syncIntervals[priority];

      // Clear existing timeout for this priority
      const existingTimeout = syncTimeouts.current.get(priority);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      if (delay === 0 && autoSyncEnabled) {
        // Critical priority - sync immediately only if auto-sync is enabled
        processPriorityQueue(priority);
      } else {
        // Schedule with delay
        const timeout = setTimeout(() => {
          if (!dataSyncDisabled) {
            // Check again when timeout fires
            processPriorityQueue(priority);
          }
          syncTimeouts.current.delete(priority);
        }, delay);

        syncTimeouts.current.set(priority, timeout);
      }
    },
    [opts.syncIntervals, autoSyncEnabled, dataSyncDisabled]
  );

  // Process queue for specific priority
  const processPriorityQueue = useCallback(
    async (priority: SyncPriority) => {
      if (!isOnline || isProcessing) {
        console.log(
          `⚠️ Skipping sync for priority ${SyncPriority[priority]} - ${
            !isOnline ? "offline" : "already processing"
          }`
        );
        return;
      }

      setIsProcessing(true);

      try {
        // Get changes for this priority that haven't been processed
        const changesToProcess = changeQueue.filter(
          (change) =>
            change.priority === priority &&
            !processedChangeIds.current.has(change.id) &&
            change.retryCount < opts.maxRetries
        );

        if (changesToProcess.length === 0) {
          return;
        }

        console.log(
          `🔄 Processing ${changesToProcess.length} changes for priority ${SyncPriority[priority]}`
        );

        // Process in batches
        const batches = [];
        for (let i = 0; i < changesToProcess.length; i += opts.batchSize) {
          batches.push(changesToProcess.slice(i, i + opts.batchSize));
        }

        for (const batch of batches) {
          await processBatch(batch);
        }
      } catch (error) {
        console.error(
          `❌ Error processing priority queue ${SyncPriority[priority]}:`,
          error
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [changeQueue, isOnline, isProcessing, opts.batchSize, opts.maxRetries]
  );

  // Process a batch of changes
  const processBatch = useCallback(
    async (batch: RecordChange[]) => {
      const results = await Promise.allSettled(
        batch.map((change) => processRecordChange(change))
      );

      let successful = 0;
      let failed = 0;

      results.forEach((result, index) => {
        const change = batch[index];

        if (result.status === "fulfilled") {
          processedChangeIds.current.add(change.id);
          successful++;
          console.log(
            `✅ Successfully synced ${change.tableName}:${change.recordId}`
          );
        } else {
          failed++;
          console.error(
            `❌ Failed to sync ${change.tableName}:${change.recordId}:`,
            result.reason
          );

          // Retry logic
          if (change.retryCount < opts.maxRetries) {
            setChangeQueue((prev) =>
              prev.map((c) =>
                c.id === change.id ? { ...c, retryCount: c.retryCount + 1 } : c
              )
            );

            // Reschedule with exponential backoff
            setTimeout(() => {
              scheduleSync(change.priority);
            }, Math.pow(2, change.retryCount) * 1000);
          } else {
            // Max retries reached, mark as processed to avoid infinite retries
            processedChangeIds.current.add(change.id);
          }
        }
      });

      // Update stats
      setSyncStats((prev) => ({
        ...prev,
        successfulSyncs: prev.successfulSyncs + successful,
        failedSyncs: prev.failedSyncs + failed,
        pendingChanges: changeQueue.length - successful,
      }));

      // Remove successfully processed changes from queue
      setChangeQueue((prev) =>
        prev.filter((change) => !processedChangeIds.current.has(change.id))
      );
    },
    [opts.maxRetries, changeQueue]
  );

  // Process individual record change
  const processRecordChange = useCallback(
    async (change: RecordChange): Promise<void> => {
      const { tableName, recordId, operation, data } = change;

      try {
        switch (operation) {
          case "insert":
            await syncRecordInsert(tableName, data);
            break;
          case "update":
            await syncRecordUpdate(tableName, recordId, data);
            break;
          case "delete":
            await syncRecordDelete(tableName, recordId);
            break;
        }
      } catch (error) {
        console.error(
          `❌ Error processing ${operation} for ${tableName}:${recordId}:`,
          error
        );
        throw error;
      }
    },
    []
  );

  // Sync record insert
  const syncRecordInsert = useCallback(async (tableName: string, data: any) => {
    const { error } = await supabase.from(tableName).insert(data);

    if (error) {
      throw new Error(`Insert failed: ${error.message}`);
    }
  }, []);

  // Sync record update
  const syncRecordUpdate = useCallback(
    async (tableName: string, recordId: string, data: any) => {
      // First check if record exists remotely
      const { data: existing, error: checkError } = await supabase
        .from(tableName)
        .select("id, last_changed")
        .eq("id", recordId)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        throw new Error(`Check failed: ${checkError.message}`);
      }

      if (existing) {
        // Record exists, update it
        const { error } = await supabase
          .from(tableName)
          .update(data)
          .eq("id", recordId);

        if (error) {
          throw new Error(`Update failed: ${error.message}`);
        }
      } else {
        // Record doesn't exist, insert it
        const { error } = await supabase.from(tableName).insert(data);

        if (error) {
          throw new Error(`Insert failed: ${error.message}`);
        }
      }
    },
    []
  );

  // Sync record delete
  const syncRecordDelete = useCallback(
    async (tableName: string, recordId: string) => {
      // For soft delete, update deleted_at field
      const { error } = await supabase
        .from(tableName)
        .update({
          deleted_at: new Date().toISOString(),
          last_changed: new Date().toISOString(),
        })
        .eq("id", recordId);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }
    },
    []
  );

  // Force sync all pending changes
  const forceSyncAll = useCallback(async () => {
    if (!isOnline) {
      console.log("⚠️ Cannot force sync while offline");
      return;
    }

    console.log("🚀 Force syncing all pending changes...");

    // Process all priority levels
    for (const priority of [
      SyncPriority.CRITICAL,
      SyncPriority.HIGH,
      SyncPriority.MEDIUM,
      SyncPriority.LOW,
    ]) {
      await processPriorityQueue(priority);
    }
  }, [isOnline, processPriorityQueue]);

  // Disabled auto-sync behavior to prevent unexpected writes during data loading
  // useEffect(() => {
  //   if (
  //     isOnline &&
  //     changeQueue.length > 0 &&
  //     autoSyncEnabled &&
  //     !dataSyncDisabled
  //   ) {
  //     console.log("📡 Coming online, syncing pending changes...");
  //     forceSyncAll();
  //   }
  // }, [
  //   isOnline,
  //   changeQueue.length,
  //   forceSyncAll,
  //   autoSyncEnabled,
  //   dataSyncDisabled,
  // ]);

  // Clear processed changes periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;

      // Remove old processed change IDs
      processedChangeIds.current = new Set(
        Array.from(processedChangeIds.current).filter((id) => {
          const timestamp = parseInt(id.split("-")[0]);
          return timestamp > oneHourAgo;
        })
      );

      // Remove old changes from queue
      setChangeQueue((prev) =>
        prev.filter((change) => {
          const changeTime = new Date(change.timestamp).getTime();
          return changeTime > oneHourAgo;
        })
      );
    }, 10 * 60 * 1000); // Every 10 minutes

    return () => clearInterval(cleanup);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      syncTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      syncTimeouts.current.clear();
    };
  }, []);

  // Update pending changes count
  useEffect(() => {
    setSyncStats((prev) => ({
      ...prev,
      totalChanges:
        prev.totalChanges +
        Math.max(0, changeQueue.length - prev.pendingChanges),
      pendingChanges: changeQueue.length,
    }));
  }, [changeQueue.length]);

  return {
    // Core functions
    queueRecordChange,
    forceSyncAll,

    // State
    syncStats,
    isProcessing,
    pendingChanges: changeQueue.length,
    isOnline,

    // Utility functions
    clearQueue: () => {
      setChangeQueue([]);
      processedChangeIds.current.clear();
    },

    // Priority helpers
    queueCriticalChange: (
      tableName: string,
      recordId: string,
      operation: "insert" | "update" | "delete",
      data?: any
    ) =>
      queueRecordChange(
        tableName,
        recordId,
        operation,
        data,
        SyncPriority.CRITICAL
      ),

    queueHighChange: (
      tableName: string,
      recordId: string,
      operation: "insert" | "update" | "delete",
      data?: any
    ) =>
      queueRecordChange(
        tableName,
        recordId,
        operation,
        data,
        SyncPriority.HIGH
      ),

    queueMediumChange: (
      tableName: string,
      recordId: string,
      operation: "insert" | "update" | "delete",
      data?: any
    ) =>
      queueRecordChange(
        tableName,
        recordId,
        operation,
        data,
        SyncPriority.MEDIUM
      ),

    queueLowChange: (
      tableName: string,
      recordId: string,
      operation: "insert" | "update" | "delete",
      data?: any
    ) =>
      queueRecordChange(tableName, recordId, operation, data, SyncPriority.LOW),

    // Functions to control sync behavior
    autoSyncEnabled,
    setAutoSyncEnabled,
    dataSyncDisabled,
    setDataSyncDisabled,
  };
}
