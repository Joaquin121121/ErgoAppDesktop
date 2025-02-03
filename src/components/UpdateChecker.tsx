import React, { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";
import styles from "../styles/updatePopupStyles.module.css";

export default function UpdateChecker({ showUpdate, setShowUpdate }) {
  const [message, setMessage] = useState("");
  const [timeoutRunning, setTimeoutRunning] = useState(null);
  const [animation, setAnimation] = useState(styles.fadeInRight);
  const [downloadedBytes, setDownloadedBytes] = useState(0);

  const checkForUpdates = async () => {
    try {
      const currentVersion = await getVersion();
      console.log("Current version:", currentVersion);

      const update = await check();
      if (update) {
        setMessage(`Actualización disponible: ${update.version}`);
        console.log("Update available:", update);

        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case "Started":
              setMessage("Descargando actualización...");
              setDownloadedBytes(0);
              console.log("Started downloading update...");
              break;
            case "Progress":
              setDownloadedBytes((prev) => prev + event.data.chunkLength);
              console.log(`Downloading: ${event.data.chunkLength} bytes`);
              break;
            case "Finished":
              setMessage("Descarga finalizada, instalando...");
              console.log("Download finished, installing update...");
              break;
          }
        });

        setMessage("Actualizacion instalada, reiniciando aplicación...");
        console.log("Update installed. Restarting application...");
        setTimeout(async () => {
          await relaunch();
        }, 1000);
      }
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      checkForUpdates();
    }, 2000);
  }, []);

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    message.length > 0 && (
      <div
        className={`absolute right-20 bottom-5 z-50 border border-secondary bg-white flex flex-col rounded-2xl shadow-sm overflow-hidden ${animation}`}
        style={{ height: "80px", width: "600px" }}
      >
        <div className="flex-1 flex items-center">
          <p className="ml-8 text-xl text-secondary">{message}</p>
          {downloadedBytes > 0 && message.includes("Descargando") && (
            <p className="ml-auto mr-8 text-sm text-gray-500">
              {formatBytes(downloadedBytes)} descargados
            </p>
          )}
        </div>
      </div>
    )
  );
}
