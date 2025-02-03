import React, { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";
import styles from "../styles/updatePopupStyles.module.css";

export default function UpdateChecker({ showUpdate, setShowUpdate }) {
  const [message, setMessage] = useState("");
  const [timeoutRunning, setTimeoutRunning] = useState(null);
  const [animation, setAnimation] = useState(styles.fadeInRight);
  const scheduleUpdate = () => {
    if (!timeoutRunning) {
      setTimeout(() => {}, 2000);
    }
  };

  const checkForUpdates = async () => {
    try {
      // Get current version
      const currentVersion = await getVersion();
      console.log("Current version:", currentVersion);

      // Check for updates
      const update = await check();
      if (update) {
        setMessage(`Actualización disponible: ${update.version}`);
        console.log("Update available:", update);

        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case "Started":
              setMessage("Descargando actualización...");
              console.log("Started downloading update...");
              break;
            case "Progress":
              setMessage(`Descargando: ${event.data.chunkLength} bytes`);
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
        // Add a slight delay to ensure installation is complete
        setTimeout(async () => {
          await relaunch();
        }, 1000);
      }
    } catch (error) {}
  };

  useEffect(() => {
    checkForUpdates();
  }, []);

  return (
    message.length > 0 && (
      <div
        className={`absolute right-20 bottom-5 z-50 border border-secondary bg-white flex items-center rounded-2xl shadow-sm ${animation}`}
        style={{ height: "80px", width: "600px" }}
      >
        <p className="ml-8 text-xl text-secondary">{message}</p>
      </div>
    )
  );
}
