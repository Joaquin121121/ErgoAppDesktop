import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export const useCloseConfirmation = () => {
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  useEffect(() => {
    const setupCloseHandler = async () => {
      const appWindow = getCurrentWindow();

      const unlisten = await appWindow.onCloseRequested(async (event) => {
        // Always prevent the initial close
        event.preventDefault();

        // Show our custom confirmation dialog
        setShowCloseConfirmation(true);
      });

      return unlisten;
    };

    const cleanupPromise = setupCloseHandler();

    return () => {
      cleanupPromise.then((cleanup) => cleanup());
    };
  }, []);

  const confirmClose = async () => {
    setShowCloseConfirmation(false);
    // Force close the window
    const appWindow = getCurrentWindow();
    await appWindow.destroy();
  };

  const cancelClose = () => {
    setShowCloseConfirmation(false);
  };

  return {
    showCloseConfirmation,
    confirmClose,
    cancelClose,
  };
};
