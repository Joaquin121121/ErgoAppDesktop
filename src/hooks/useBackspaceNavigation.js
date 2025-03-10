import { useEffect } from "react";

/**
 * Custom hook that adds a Backspace key event listener to navigate back
 * @param {Function} onClose - The function to call when Backspace is pressed
 * @param {Array} dependencies - Optional array of dependencies for the useEffect hook
 */
const useBackspaceNavigation = (onClose, dependencies = []) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only trigger onClose if Backspace is pressed AND no input/textarea is focused
      if (
        event.key === "Backspace" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement.tagName
        )
      ) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, dependencies);
};

export default useBackspaceNavigation;
