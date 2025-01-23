import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface LogEntry {
  timestamp: string;
  type: "info" | "error";
  message: string;
  data?: any;
}

const useSerialMonitor = () => {
  const [serialData, setSerialData] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (type: "info" | "error", message: string, data?: any) => {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data,
    };
    setLogs((prev) => [...prev, logEntry]);
  };

  useEffect(() => {
    const setupListeners = async () => {
      try {
        // Listen for serial data
        const unlisten = await listen("serial-data", (event) => {
          addLog("info", "Received serial data", event.payload);
          setSerialData((prev) => [...prev, event.payload as string]);
        });

        // Listen for serial errors
        const unlistenError = await listen("serial-error", (event) => {
          addLog("error", "Received serial error", event.payload);
          setError(event.payload as string);
        });

        // Cleanup function to remove listeners
        return () => {
          unlisten();
          unlistenError();
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        addLog("error", "Error setting up serial listeners", errorMessage);
        setError(errorMessage);
      }
    };

    setupListeners();
  }, []);

  const startSerialListener = async (portName: string, baudRate: number) => {
    try {
      setError(null); // Clear any previous errors
      addLog("info", "Starting serial listener", { portName, baudRate });

      await invoke("listen_serial", { portName, baudRate });
      addLog("info", "Serial listener started successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to start serial listener";

      addLog("error", "Error starting serial listener", errorMessage);
      setError(errorMessage);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return {
    serialData,
    error,
    startSerialListener,
    logs,
    clearLogs,
  };
};

export default useSerialMonitor;
