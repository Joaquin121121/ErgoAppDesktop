import React, { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { getVersion } from "@tauri-apps/api/app";
export default function UpdateChecker() {
  const [message, setMessage] = useState("");
  const checkForUpdates = async () => {
    try {
      // Get current version
      const currentVersion = await getVersion();
      console.log("Current version:", currentVersion);

      // Check for updates
      const update = await check();
      setMessage("Update check result: " + update);

      if (update) {
        setMessage("Update available:");
      } else {
        setMessage("No updates available");
      }
    } catch (error) {
      setMessage("Update check failed:" + error);
    }
  };

  useEffect(() => {
    checkForUpdates();
  }, []);

  useEffect(() => {
    fetch(
      "https://github.com/Joaquin121121/ErgoAppDesktop/releases/latest/download/latest.json"
    )
      .then((response) => response.json())
      .then((data) => console.log("Fetched JSON:", data))
      .catch((error) => console.error("Fetch error:", error));
  }, []);
  return (
    <div className="absolute right-20 top-20 z-50 bg-white h-100 w-100 text-black">
      {}
    </div>
  );
}
