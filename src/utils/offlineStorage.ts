interface PendingRequest {
  id: string;
  type: "insert" | "update" | "delete";
  table: string;
  data: any;
  timestamp: number;
}

const STORAGE_KEY = "ergoapp_pending_requests";

// Get all pending requests from local storage
export const getPendingRequests = (): PendingRequest[] => {
  const storedRequests = localStorage.getItem(STORAGE_KEY);
  if (!storedRequests) return [];

  try {
    return JSON.parse(storedRequests);
  } catch (error) {
    console.error("Failed to parse pending requests:", error);
    return [];
  }
};

// Add a new pending request to local storage
export const addPendingRequest = (
  request: Omit<PendingRequest, "id" | "timestamp">
): void => {
  const pendingRequests = getPendingRequests();

  const newRequest: PendingRequest = {
    ...request,
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };

  pendingRequests.push(newRequest);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingRequests));
};

// Remove a pending request from local storage by ID
export const removePendingRequest = (id: string): void => {
  let pendingRequests = getPendingRequests();
  pendingRequests = pendingRequests.filter((req) => req.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingRequests));
};

// Clear all pending requests
export const clearPendingRequests = (): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
};
