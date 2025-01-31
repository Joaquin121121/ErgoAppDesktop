import React, { useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { getVersion } from "@tauri-apps/api/app";

export default function UpdateChecker() {
  const checkForUpdates = async () => {
    try {
      // Get current version
      const currentVersion = await getVersion();
      console.log("Current version:", currentVersion);

      // Check for updates
      const update = await check();
      console.log("Update check result:", update);

      if (update) {
        console.log("Update available:", {
          currentVersion,
          newVersion: update.version,
          availableUpdate: update,
        });
      } else {
        console.log("No updates available");
      }
    } catch (error) {
      console.error("Update check failed:", error);
    }
  };

  useEffect(() => {
    checkForUpdates();
  }, []);
  return <div></div>;
}
