import React, { useState, useEffect, useRef } from "react";
import styles from "../styles/updatePopupStyles.module.css";
import { useCalendar } from "../contexts/CalendarContext";

interface ConnectionStatusProps {
  showUpdate: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ showUpdate }) => {
  const { isOnline, pendingSyncCount } = useCalendar();
  const [visible, setVisible] = useState(false);
  const [animation, setAnimation] = useState(styles.fadeInRight);
  const prevOnlineStatusRef = useRef(isOnline);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Skip if the update popup is shown
    if (showUpdate) return;

    // Always handle status changes - even if multiple changes occur
    if (prevOnlineStatusRef.current !== isOnline || visible) {
      // Clear any existing timers
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Show the notification
      setAnimation(styles.fadeInRight);
      setVisible(true);

      // Set timeout to hide after 10 seconds
      timerRef.current = window.setTimeout(() => {
        setAnimation(styles.fadeOutRight);

        // After animation completes, hide component
        window.setTimeout(() => {
          setVisible(false);
        }, 300); // Animation duration

        timerRef.current = null;
      }, 10000);

      // Update the previous value
      prevOnlineStatusRef.current = isOnline;
    }

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isOnline, showUpdate, visible]);

  if (!visible || showUpdate) return null;

  return (
    <div
      className={`absolute right-20 bottom-5 z-40 border border-secondary bg-white flex flex-col rounded-2xl shadow-sm overflow-hidden px-16 ${animation}`}
      style={{ height: "80px" }}
    >
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex gap-x-8 items-center">
          <div
            className={`w-3 h-3 rounded-full bg-${
              isOnline ? "green" : "fire"
            } ${styles.blink}`}
            style={{
              backgroundColor: isOnline ? "#00A859" : "#FF9501",
            }}
          ></div>
          <p className="text-xl">
            {isOnline
              ? "Conectado a internet"
              : "Sin conexión a internet - Modo offline activo"}
          </p>
        </div>

        {!isOnline && pendingSyncCount > 0 && (
          <div className="text-darkGray flex items-center">
            <span className="mr-2">
              {pendingSyncCount}{" "}
              {pendingSyncCount === 1
                ? "actualización pendiente"
                : "actualizaciones pendientes"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;
