import React, { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";

export default function UpdateChecker() {
  const [message, setMessage] = useState("");

  const checkForUpdates = async () => {
    try {
      // Get current version
      const currentVersion = await getVersion();
      console.log("Current version:", currentVersion);

      // Check for updates
      const update = await check();
      if (update) {
        setMessage(`Update available: ${update.version}`);
        console.log("Update available:", update);

        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case "Started":
              setMessage("Started downloading update...");
              console.log("Started downloading update...");
              break;
            case "Progress":
              setMessage(`Downloading: ${event.data.chunkLength} bytes`);
              console.log(`Downloading: ${event.data.chunkLength} bytes`);
              break;
            case "Finished":
              setMessage("Download finished, installing update...");
              console.log("Download finished, installing update...");
              break;
          }
        });

        setMessage("Update installed. Restarting application...");
        console.log("Update installed. Restarting application...");
        // Add a slight delay to ensure installation is complete
        setTimeout(async () => {
          await relaunch();
        }, 15000);
      } else {
        setMessage("No updates available");
        console.log("No updates available");
      }
    } catch (error) {
      setMessage("Update check failed: " + error);
      console.error("Update check failed:", error);
    }
  };

  useEffect(() => {
    checkForUpdates();
  }, []);

  return (
    <div className="absolute right-20 top-20 z-50 bg-white h-100 w-100 text-black">
      {"Message is of type" + typeof message + " and it is " + message}
    </div>
  );
}
