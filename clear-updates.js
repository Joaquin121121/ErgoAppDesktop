// Script to clear all pending requests
(function () {
  const key = "ergoapp_pending_requests";
  try {
    const pendingData = JSON.parse(localStorage.getItem(key) || "[]");

    console.log("====== PENDING REQUESTS DETAILS ======");
    if (pendingData.length === 0) {
      console.log("No pending requests found");
    } else {
      pendingData.forEach((req, index) => {
        console.log(`Request #${index + 1}:`);
        console.log(`- Type: ${req.type}`);
        console.log(`- Table: ${req.table}`);
        console.log(`- ID: ${req.id}`);
        console.log(`- Data:`, req.data);
        console.log(`- Timestamp: ${new Date(req.timestamp).toLocaleString()}`);
        console.log("---");
      });
    }

    // Clear all requests
    localStorage.setItem(key, "[]");
    console.log(`CLEARED ALL ${pendingData.length} PENDING REQUESTS`);
    console.log("Refresh the application to see changes");

    return `Cleared all ${pendingData.length} pending requests. Refresh the app to update the UI`;
  } catch (e) {
    console.error("Error:", e);
    return "Error clearing pending requests: " + e.message;
  }
})();
