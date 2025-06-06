import React from "react";
import { useRecordSync } from "../hooks/useRecordSync";

export const SyncMonitor: React.FC = () => {
  const {
    syncStats,
    isProcessing,
    pendingChanges,
    isOnline,
    forceSyncAll,
    clearQueue,
  } = useRecordSync();

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "rgba(0,0,0,0.8)",
        color: "white",
        padding: "12px",
        borderRadius: "8px",
        fontSize: "12px",
        minWidth: "200px",
        zIndex: 1000,
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
        📊 Sync Monitor
      </div>

      <div style={{ marginBottom: "4px" }}>
        Status: {isOnline ? "🟢 Online" : "🔴 Offline"}
        {isProcessing && " (⏳ Syncing...)"}
      </div>

      <div style={{ marginBottom: "4px" }}>
        Pending: {pendingChanges} changes
      </div>

      <div style={{ marginBottom: "4px" }}>
        ✅ Success: {syncStats.successfulSyncs}
      </div>

      <div style={{ marginBottom: "4px" }}>
        ❌ Failed: {syncStats.failedSyncs}
      </div>

      <div style={{ marginBottom: "8px" }}>
        📈 Total: {syncStats.totalChanges}
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={forceSyncAll}
          disabled={!isOnline || isProcessing}
          style={{
            padding: "4px 8px",
            fontSize: "10px",
            border: "none",
            borderRadius: "4px",
            background: isOnline && !isProcessing ? "#007bff" : "#6c757d",
            color: "white",
            cursor: isOnline && !isProcessing ? "pointer" : "not-allowed",
          }}
        >
          🚀 Force Sync
        </button>

        <button
          onClick={clearQueue}
          disabled={pendingChanges === 0}
          style={{
            padding: "4px 8px",
            fontSize: "10px",
            border: "none",
            borderRadius: "4px",
            background: pendingChanges > 0 ? "#dc3545" : "#6c757d",
            color: "white",
            cursor: pendingChanges > 0 ? "pointer" : "not-allowed",
          }}
        >
          🗑️ Clear
        </button>
      </div>
    </div>
  );
};

export default SyncMonitor;
