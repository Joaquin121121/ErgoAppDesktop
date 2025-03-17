import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export interface LogEntry {
  timestamp: string;
  type: "info" | "error";
  message: string;
  data?: any;
}

export interface SerialPortInfo {
  port_name: string;
  port_type: string;
  manufacturer?: string;
  product?: string;
  serial_number?: string;
}

const useSerialMonitor = () => {
  const [serialData, setSerialData] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [availablePorts, setAvailablePorts] = useState<SerialPortInfo[]>([]);

  const addLog = (type: "info" | "error", message: string, data?: any) => {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data,
    };
    setLogs((prev) => [...prev, logEntry]);
  };

  const checkAvailablePorts = async () => {
    try {
      const ports = await invoke<SerialPortInfo[]>("list_serial_ports");
      setAvailablePorts(ports);
      return ports;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to list serial ports";
      addLog("error", "Error listing serial ports", errorMessage);
      return [];
    }
  };

  useEffect(() => {
    const setupListeners = async () => {
      try {
        const unlisten = await listen("serial-data", (event) => {
          addLog("info", "Received serial data", event.payload);
          setSerialData((prev) => [...prev, event.payload as string]);
          setIsConnected(true);
        });

        const unlistenError = await listen("serial-error", (event) => {
          addLog("error", "Serial error", event.payload);
          setError(event.payload as string);
          setIsConnected(false);
        });

        return () => {
          unlisten();
          unlistenError();
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        addLog("error", "Error setting up serial listeners", errorMessage);
        setError(errorMessage);
        setIsConnected(false);
      }
    };

    setupListeners();
  }, []);

  const startSerialListener = async (baudRate: number) => {
    try {
      setError(null);

      // First check available ports
      const ports = await checkAvailablePorts();
      if (ports.length === 0) {
        throw new Error("No serial ports available");
      }

      addLog("info", "Starting serial listener", { baudRate });

      const portName = await invoke<string>("listen_serial", { baudRate });

      addLog("info", "Serial listener started successfully", { portName });
      setIsConnected(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to start serial listener";
      addLog("error", "Error starting serial listener", errorMessage);
      setError(errorMessage);
      setIsConnected(false);
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
    isConnected,
    availablePorts,
    checkAvailablePorts,
  };
};

export default useSerialMonitor;
