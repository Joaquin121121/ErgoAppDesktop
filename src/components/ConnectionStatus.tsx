import React, { useState, useEffect, useRef } from "react";
import styles from "../styles/updatePopupStyles.module.css";
import { useCalendar } from "../contexts/CalendarContext";
import { useDatabaseSync } from "../hooks/useDatabaseSync";

interface ConnectionStatusProps {
  showUpdate: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ showUpdate }) => {
  const {
    isOnline,
    syncStatus,
    error: syncError,
    syncAllTables,
  } = useDatabaseSync();
  const [visible, setVisible] = useState(false);
  const [animation, setAnimation] = useState(styles.fadeInRight);
  const prevOnlineStatusRef = useRef(isOnline);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  // Constants
  const AUTO_HIDE_DELAY = 5000; // 5 seconds auto-hide delay

  // Trigger database sync on component mount (app start) if online
  useEffect(() => {
    if (!isOnline) return;

    // Attempt to sync databases on app startup
    const initialSync = async () => {
      try {
        await syncAllTables(true);
      } catch (error) {
        console.error("Error during initial database sync:", error);
      }
    };

    initialSync();
  }, [isOnline]);

  // Log sync errors for debugging
  useEffect(() => {
    if (syncError) {
      console.error("Database sync error:", syncError);
    }
  }, [syncError]);

  // Show notification and ensure it auto-hides
  const showNotification = () => {
    // Show the notification
    setAnimation(styles.fadeInRight);
    setVisible(true);

    // Always auto-hide after delay, regardless of sync status
    setTimerId(
      setTimeout(() => {
        setAnimation(styles.fadeOutRight);

        setTimeout(() => {
          setVisible(false);
        }, 300); // Animation duration
      }, AUTO_HIDE_DELAY)
    );
  };

  // Handle status changes
  useEffect(() => {
    // Skip if the update popup is shown
    if (showUpdate) return;

    const onlineStatusChanged = prevOnlineStatusRef.current !== isOnline;

    // When coming back online, trigger a sync automatically
    if (onlineStatusChanged && isOnline) {
      console.log("Connection restored - triggering automatic sync");
      syncAllTables(true);
    }

    // Show notification whenever status changes
    if (
      onlineStatusChanged ||
      syncStatus === "syncing" ||
      syncStatus === "error"
    ) {
      showNotification();
    }

    // Also show notification when syncStatus changes to success
    if (syncStatus === "success") {
      showNotification();
    }

    // Update online status reference
    prevOnlineStatusRef.current = isOnline;

    // Cleanup on unmount
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [isOnline, syncStatus, showUpdate]);

  if (!visible || showUpdate) return null;

  return (
    <div
      className={`fixed right-20 bottom-5 z-40 border border-secondary bg-white flex flex-col items-center rounded-2xl shadow-sm overflow-hidden px-8 ${animation}`}
      style={{
        height: "80px",
        minHeight: "80px",
        maxWidth: "450px",
      }}
    >
      <div className="my-auto w-full flex gap-x-8 items-center justify-center">
        <div
          className={`w-3 h-3 rounded-full ${styles.blink}`}
          style={{
            backgroundColor:
              syncStatus === "syncing"
                ? "#FFD700" // yellow during sync
                : syncStatus === "error"
                ? "#F44336" // red on error
                : isOnline
                ? "#00A859" // green when online
                : "#FF9501", // orange when offline
          }}
        ></div>
        <p className="text-xl">
          {syncStatus === "syncing"
            ? "Sincronizando bases de datos..."
            : syncStatus === "error"
            ? "Error de sincronización"
            : isOnline
            ? "Conectado a internet"
            : "Sin conexión a internet - Modo offline activo"}
        </p>
      </div>
    </div>
  );
};

export default ConnectionStatus;
