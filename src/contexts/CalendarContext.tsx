import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { CalendarEvent } from "../components/Calendar";
import { supabase } from "../supabase";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import {
  addPendingRequest,
  getPendingRequests,
  removePendingRequest,
} from "../utils/offlineStorage";

// Local storage keys
const STORED_EVENTS_KEY = "ergoapp_events";

// Type definitions for event listeners
type ChangeType = "add" | "update" | "delete" | "sync";
type ChangeListener = (type: ChangeType, event?: CalendarEvent) => void;

// Type definition for pending requests
interface PendingRequest {
  id: string;
  type: "insert" | "update" | "delete";
  table: string;
  data: any;
  timestamp: number;
}

interface CalendarContextType {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  addingEvent: boolean;
  setAddingEvent: (adding: boolean) => void;
  eventInfo: CalendarEvent | null;
  setEventInfo: (event: CalendarEvent | null) => void;
  events: CalendarEvent[];
  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: Omit<CalendarEvent, "id">) => Promise<void>;
  updateEvent: (event: CalendarEvent) => Promise<void>;
  deleteEvent: (id: string | number) => Promise<void>;
  isOnline: boolean;
  pendingSyncCount: number;
  // Add change listener functions
  addChangeListener: (listener: ChangeListener) => void;
  removeChangeListener: (listener: ChangeListener) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined
);

// Helper function to load events from local storage
const loadEventsFromStorage = (): CalendarEvent[] => {
  try {
    const storedEvents = localStorage.getItem(STORED_EVENTS_KEY);
    if (storedEvents) {
      const parsedEvents = JSON.parse(storedEvents);
      // Convert string dates back to Date objects if needed
      return parsedEvents.map((event: any) => ({
        ...event,
        // Ensure event_date is properly formatted
        event_date: event.event_date,
      }));
    }
  } catch (error) {
    console.error("Failed to load events from storage:", error);
  }
  return [];
};

// Helper function to save events to local storage
const saveEventsToStorage = (events: CalendarEvent[]) => {
  try {
    localStorage.setItem(STORED_EVENTS_KEY, JSON.stringify(events));
  } catch (error) {
    console.error("Failed to save events to storage:", error);
  }
};

// Helper to check if an event ID matches a temporary ID
const isMatchingTempId = (
  eventId: string | number,
  tempId: string
): boolean => {
  if (typeof eventId === "string") {
    return eventId === tempId;
  }
  return false;
};

// Helper to identify temporary events (those created offline)
const isTempEvent = (eventId: string | number): boolean => {
  return typeof eventId === "string" && eventId.startsWith("temp_");
};

// Helper to get current timestamp in ISO format
const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

// Helper to clean up temporary events that have been processed
const cleanupProcessedTempEvents = (
  events: CalendarEvent[],
  pendingRequests: PendingRequest[]
): CalendarEvent[] => {
  // If there are no pending requests, remove all temp events
  if (pendingRequests.length === 0) {
    return events.filter((event) => !isTempEvent(event.id));
  }

  // Get all tempIds from pending requests
  const pendingTempIds = pendingRequests
    .filter((req) => req.table === "event" && req.type === "insert")
    .map((req) => req.data.tempId)
    .filter(Boolean);

  // Keep only temp events that are still pending
  return events.filter((event) => {
    if (!isTempEvent(event.id)) return true;
    return pendingTempIds.includes(event.id);
  });
};

// Helper to resolve conflicts between events with same ID
const resolveConflict = (
  localEvent: CalendarEvent,
  serverEvent: CalendarEvent
): CalendarEvent => {
  // If local event has a last_changed timestamp and it's more recent than server event
  if (
    localEvent.last_changed &&
    serverEvent.last_changed &&
    new Date(localEvent.last_changed) > new Date(serverEvent.last_changed)
  ) {
    // Keep local changes but use server ID
    return {
      ...localEvent,
      id: serverEvent.id,
    };
  }

  // Otherwise use server version
  return serverEvent;
};

// Helper to check network connection in real-time
const checkNetworkConnection = async (): Promise<boolean> => {
  try {
    // Try to reach Supabase with a small request
    const { data, error } = await supabase
      .from("event")
      .select("id")
      .limit(1)
      .maybeSingle();
    return !error;
  } catch (e) {
    console.error("Network check failed:", e);
    return false;
  }
};

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [addingEvent, setAddingEvent] = useState(false);
  const [eventInfo, setEventInfo] = useState<CalendarEvent | null>(null);
  const [events, setEventsState] = useState<CalendarEvent[]>(() =>
    loadEventsFromStorage()
  );
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const { isOnline } = useOnlineStatus();

  // Add change listeners for components that need to react to event changes
  const [changeListeners, setChangeListeners] = useState<ChangeListener[]>([]);

  // Helper to notify all listeners of a change
  const notifyListeners = useCallback(
    (type: ChangeType, event?: CalendarEvent) => {
      changeListeners.forEach((listener) => {
        try {
          listener(type, event);
        } catch (error) {
          console.error("Error in change listener:", error);
        }
      });
    },
    [changeListeners]
  );

  // Add a change listener
  const addChangeListener = useCallback((listener: ChangeListener) => {
    setChangeListeners((prev) => [...prev, listener]);
  }, []);

  // Remove a change listener
  const removeChangeListener = useCallback((listener: ChangeListener) => {
    setChangeListeners((prev) => prev.filter((l) => l !== listener));
  }, []);

  // Enhance fetchEvents to explicitly handle deletions
  const fetchEvents = useCallback(async () => {
    if (!isOnline) return;

    try {
      console.log("Fetching all events from Supabase for sync");
      const { data, error } = await supabase.from("event").select("*");

      if (error) {
        console.error("Error fetching events:", error);
        return;
      }

      if (!data) {
        console.log("No data returned from Supabase");
        return;
      }

      console.log(`Fetched ${data.length} events from Supabase`);

      // Create a Set of server event IDs for quick lookup
      const serverEventIds = new Set(data.map((event) => event.id));
      console.log("Server event IDs:", Array.from(serverEventIds));

      setEventsState((prevEvents) => {
        // Keep track of changes made
        let changes = { added: 0, updated: 0, deleted: 0 };

        // 1. Find events that exist locally but not on server (were deleted)
        const deletedEvents = prevEvents.filter(
          (event) =>
            !isTempEvent(event.id) &&
            typeof event.id === "number" &&
            !serverEventIds.has(event.id)
        );

        if (deletedEvents.length > 0) {
          console.log(
            `Found ${deletedEvents.length} events deleted on server:`,
            deletedEvents.map((e) => e.id)
          );
          changes.deleted = deletedEvents.length;

          // Notify listeners about each deleted event
          deletedEvents.forEach((event) => {
            notifyListeners("delete", { id: event.id } as CalendarEvent);
          });
        }

        // 2. Keep temporary events and events that still exist on server
        const remainingEvents = prevEvents.filter(
          (event) =>
            isTempEvent(event.id) ||
            typeof event.id !== "number" ||
            serverEventIds.has(event.id)
        );

        // 3. Process server events - add new ones and update existing ones
        const serverEventsMap: Record<number, CalendarEvent> = {};
        const updatedEvents = [...remainingEvents];

        data.forEach((serverEvent) => {
          const eventData = serverEvent as CalendarEvent;
          const existingIndex = remainingEvents.findIndex(
            (e) => e.id === eventData.id
          );

          if (existingIndex === -1) {
            // Event doesn't exist locally, add it
            updatedEvents.push(eventData);
            changes.added++;
            console.log(`Adding new event from server: ${eventData.id}`);
            notifyListeners("add", eventData);
          } else {
            // Event exists locally, update it if needed
            const localEvent = remainingEvents[existingIndex];
            const resolvedEvent = resolveConflict(localEvent, eventData);

            if (resolvedEvent !== localEvent) {
              updatedEvents[existingIndex] = resolvedEvent;
              changes.updated++;
              console.log(
                `Updating existing event from server: ${eventData.id}`
              );
              notifyListeners("update", resolvedEvent);
            }
          }
        });

        console.log(
          `Sync complete: ${changes.added} added, ${changes.updated} updated, ${changes.deleted} deleted`
        );

        // Only save if changes were made
        if (changes.added > 0 || changes.updated > 0 || changes.deleted > 0) {
          console.log("Changes detected, saving to local storage");
          saveEventsToStorage(updatedEvents);
          notifyListeners("sync");
        } else {
          console.log("No changes detected during sync");
        }

        return updatedEvents;
      });
    } catch (error) {
      console.error("Failed to fetch events for sync:", error);
    }
  }, [isOnline, notifyListeners]);

  // Setup Supabase realtime subscription
  useEffect(() => {
    if (!isOnline) return;

    console.log("Setting up enhanced realtime subscription for event table");

    // Create a single channel with multiple handlers for different operations
    const channel = supabase.channel("events-channel");

    // DELETE handler - most important for our issue
    channel.on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "event" },
      (payload) => {
        console.log("DELETE event received from Supabase:", payload);

        try {
          // Extract deleted record ID from payload.old
          const oldRecord = payload.old as Record<string, any>;
          if (!oldRecord || !oldRecord.id) {
            console.error("Invalid DELETE payload, missing old.id:", payload);
            return;
          }

          const deletedId = oldRecord.id;
          console.log(`Event with ID ${deletedId} was deleted in Supabase`);

          // Update local state to remove the deleted event
          setEventsState((prevEvents) => {
            // Check if we have this event
            const existingIndex = prevEvents.findIndex(
              (e) => e.id === deletedId
            );

            if (existingIndex >= 0) {
              console.log(
                `Found event ${deletedId} at index ${existingIndex}, removing from local state`
              );

              // Create a new array without the deleted event
              const updatedEvents = [
                ...prevEvents.slice(0, existingIndex),
                ...prevEvents.slice(existingIndex + 1),
              ];

              // Save to storage and notify listeners
              saveEventsToStorage(updatedEvents);
              notifyListeners("delete", { id: deletedId } as CalendarEvent);

              console.log(`Event ${deletedId} removed from local state`);
              return updatedEvents;
            } else {
              console.log(
                `Event ${deletedId} not found in local state, nothing to remove`
              );
              return prevEvents;
            }
          });
        } catch (error) {
          console.error("Error processing DELETE event:", error);
        }
      }
    );

    // INSERT handler
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "event" },
      (payload) => {
        console.log("INSERT event received from Supabase:", payload);
        const newEvent = payload.new as CalendarEvent;

        if (!newEvent || !newEvent.id) {
          console.error("Invalid INSERT payload, missing new.id:", payload);
          return;
        }

        setEventsState((prevEvents) => {
          // Only add if we don't already have this event
          if (!prevEvents.some((e) => e.id === newEvent.id)) {
            console.log(
              `Adding new event with ID ${newEvent.id} to local state`
            );
            const updatedEvents = [...prevEvents, newEvent];
            saveEventsToStorage(updatedEvents);
            notifyListeners("add", newEvent);
            return updatedEvents;
          }
          console.log(
            `Event ${newEvent.id} already exists in local state, not adding`
          );
          return prevEvents;
        });
      }
    );

    // UPDATE handler
    channel.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "event" },
      (payload) => {
        console.log("UPDATE event received from Supabase:", payload);
        const updatedEvent = payload.new as CalendarEvent;

        if (!updatedEvent || !updatedEvent.id) {
          console.error("Invalid UPDATE payload, missing new.id:", payload);
          return;
        }

        setEventsState((prevEvents) => {
          // Find and update the event
          const existingIndex = prevEvents.findIndex(
            (e) => e.id === updatedEvent.id
          );

          if (existingIndex >= 0) {
            console.log(
              `Updating event with ID ${updatedEvent.id} in local state`
            );

            // Apply conflict resolution if needed
            const oldEvent = prevEvents[existingIndex];
            const resolvedEvent = resolveConflict(oldEvent, updatedEvent);

            // Create a new array with the updated event
            const updatedEvents = [
              ...prevEvents.slice(0, existingIndex),
              resolvedEvent,
              ...prevEvents.slice(existingIndex + 1),
            ];

            saveEventsToStorage(updatedEvents);
            notifyListeners("update", resolvedEvent);
            return updatedEvents;
          }

          console.log(
            `Event ${updatedEvent.id} not found in local state, not updating`
          );
          return prevEvents;
        });
      }
    );

    // Subscribe to all handlers
    channel.subscribe((status) => {
      console.log("Supabase realtime subscription status:", status);
    });

    // Setup periodic full fetch to catch any missed events
    const fullSyncInterval = setInterval(() => {
      console.log("Performing periodic full sync with Supabase");
      fetchEvents();
    }, 60000); // Every minute

    // Cleanup on unmount
    return () => {
      console.log("Cleaning up Supabase realtime subscription");
      channel.unsubscribe();
      clearInterval(fullSyncInterval);
    };
  }, [isOnline, notifyListeners, fetchEvents]);

  // Process any pending offline requests
  const processPendingRequests = useCallback(async () => {
    if (!isOnline) return Promise.resolve(); // Return resolved promise when offline

    console.log("Processing pending requests...");
    const pendingRequests = getPendingRequests();
    if (pendingRequests.length === 0) {
      console.log("No pending requests to process");
      return Promise.resolve(); // Return resolved promise when no pending requests
    }

    console.log(`Found ${pendingRequests.length} pending requests to process`);
    setPendingSyncCount(pendingRequests.length);

    // Sort requests by timestamp to ensure proper order
    const sortedRequests = [...pendingRequests].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    let processedCount = 0;
    let successfulRequestIds = []; // Track successfully processed request IDs

    // Process deletes first to ensure they happen before potential server synchronization
    const deleteRequests = sortedRequests.filter(
      (req) => req.type === "delete"
    );
    const otherRequests = sortedRequests.filter((req) => req.type !== "delete");

    // Prioritize delete requests first, then other types
    const prioritizedRequests = [...deleteRequests, ...otherRequests];

    try {
      for (const request of prioritizedRequests) {
        try {
          if (request.table !== "event") {
            console.log(`Skipping non-event request: ${request.table}`);
            continue;
          }

          console.log(
            `Processing ${request.type} request for event`,
            request.data
          );
          let result;

          if (request.type === "insert") {
            // Remove any fields that shouldn't be sent to the server
            const { tempId, ...rawData } = request.data;

            // Extract only valid fields for the database
            const {
              coach_id = "1", // Default coach_id to "1" if not provided
              event_type,
              event_name,
              athlete_name,
              event_date,
              duration,
              last_changed,
            } = rawData;

            // Create validated data with only fields that exist in the database
            const validEventData = {
              coach_id,
              event_type,
              event_name,
              athlete_name,
              event_date,
              duration,
              last_changed: last_changed || getCurrentTimestamp(),
            };

            console.log(
              "Inserting event from pending request:",
              validEventData
            );

            try {
              result = await supabase
                .from("event")
                .insert(validEventData)
                .select();

              console.log("Insert result:", result);

              if (result.error) {
                console.error("Insert error:", result.error);
              } else {
                // Success - add to the list of processed requests
                successfulRequestIds.push(request.id);

                // If successful, update any temporary events with the real ID
                if (result?.data && result.data.length > 0) {
                  const realEvent = result.data[0];
                  console.log(
                    "Successfully inserted event, got real ID:",
                    realEvent.id
                  );

                  setEventsState((prev) => {
                    // Replace the temporary event with the real one
                    const tempId = request.data.tempId;
                    console.log(
                      `Looking for temp event with ID ${tempId} to replace`
                    );

                    const updated = prev.map((e) => {
                      // Check if this is the temporary event we're replacing
                      if (isMatchingTempId(e.id, tempId)) {
                        console.log(
                          `Found and replacing temp event ${tempId} with real event ${realEvent.id}`
                        );
                        const finalEvent = realEvent as CalendarEvent;
                        notifyListeners("add", finalEvent);
                        return finalEvent;
                      }
                      return e;
                    });
                    saveEventsToStorage(updated);
                    return updated;
                  });
                }
              }
            } catch (error) {
              console.error("Exception during insert:", error);
            }
          } else if (request.type === "update") {
            if (request.table === "event") {
              try {
                const reqData = request.data as Partial<CalendarEvent>;
                // Extract the id from the request data
                const eventId = reqData.id;

                if (!eventId) {
                  console.error(
                    "Cannot process update - missing ID in request data:",
                    request.data
                  );
                  successfulRequestIds.push(request.id);
                  continue;
                }

                // Remove the id from the data being sent for update
                const { id, ...updateData } = reqData;

                // Filter valid fields for the update
                const validKeys = [
                  "coach_id",
                  "event_type",
                  "event_name",
                  "athlete_name",
                  "event_date",
                  "duration",
                  "last_changed",
                ];

                const validEventData: Record<string, any> = {};

                Object.keys(updateData).forEach((key) => {
                  if (validKeys.includes(key)) {
                    validEventData[key] = (updateData as any)[key];
                  }
                });

                // Add last_changed if not present
                if (!validEventData.last_changed) {
                  validEventData.last_changed = new Date().toISOString();
                }

                console.log(
                  "Processing pending update for event ID:",
                  eventId,
                  "with data:",
                  validEventData
                );

                const { data, error } = await supabase
                  .from("event")
                  .update(validEventData)
                  .eq("id", eventId)
                  .select();

                if (error) {
                  console.error("Error processing pending update:", error);

                  // If row not found, we can mark the request as completed
                  if (error.code === "PGRST116") {
                    console.log(
                      "Event not found, marking update request as completed"
                    );
                    successfulRequestIds.push(request.id);
                  }
                } else {
                  console.log("Successfully processed pending update:", data);
                  successfulRequestIds.push(request.id);

                  // Update local state with server response
                  if (data && data.length > 0) {
                    setEventsState((prev) => {
                      const updated = prev.map((event) => {
                        if (event.id === eventId) {
                          return data[0] as CalendarEvent;
                        }
                        return event;
                      });
                      saveEventsToStorage(updated);
                      return updated;
                    });
                  }
                }
              } catch (error) {
                console.error("Failed to process pending update:", error);
              }
            }
          } else if (request.type === "delete") {
            // For deletes, we don't check timestamps - last operation wins
            console.log(`Deleting event with ID ${request.data.id}`);

            try {
              result = await supabase
                .from("event")
                .delete()
                .eq("id", request.data.id);

              console.log("Delete result:", result);

              if (result.error) {
                console.error("Delete error:", result.error);

                // If the error is "not found", consider it successful
                if (
                  result.error.code === "23503" ||
                  result.error.message.includes("not found")
                ) {
                  console.log(
                    "Record already deleted or doesn't exist - marking as successful"
                  );
                  successfulRequestIds.push(request.id);
                }
              } else {
                // Success - add to the list of processed requests
                successfulRequestIds.push(request.id);

                // The delete operation is already reflected in UI due to optimistic updates
                // Just notify listeners in case any components need to know
                notifyListeners("delete", {
                  id: request.data.id,
                } as CalendarEvent);
              }
            } catch (error) {
              console.error("Exception during delete:", error);
            }
          }

          processedCount++;
        } catch (error) {
          console.error(`Error processing request:`, error);
        }
      }

      console.log(
        `Processed ${processedCount} of ${prioritizedRequests.length} pending requests`
      );
      console.log(
        `Successfully completed ${successfulRequestIds.length} requests`
      );

      // Remove all successful requests at once
      if (successfulRequestIds.length > 0) {
        console.log(
          `Removing ${successfulRequestIds.length} completed requests from storage`
        );
        successfulRequestIds.forEach((id) => {
          try {
            removePendingRequest(id);
          } catch (error) {
            console.error(`Error removing request ${id}:`, error);
          }
        });
      }

      // Clean up any orphaned temporary events
      const remainingRequests = getPendingRequests();
      setEventsState((prev) => {
        const cleanedEvents = cleanupProcessedTempEvents(
          prev,
          remainingRequests
        );
        if (cleanedEvents.length !== prev.length) {
          console.log(
            `Cleaned up ${
              prev.length - cleanedEvents.length
            } orphaned temporary events`
          );
          saveEventsToStorage(cleanedEvents);
        }
        return cleanedEvents;
      });

      // Update the pending count
      const newPendingCount = getPendingRequests().filter(
        (req) => req.table === "event"
      ).length;
      console.log(`Updated pending count: ${newPendingCount}`);
      setPendingSyncCount(newPendingCount);

      return Promise.resolve(); // Return a resolved promise when done
    } catch (error) {
      console.error("Error processing pending requests:", error);
      return Promise.reject(error); // Return rejected promise on error
    }
  }, [isOnline, notifyListeners]);

  // Initial data fetch and process any pending requests
  useEffect(() => {
    if (isOnline) {
      // Important: Process pending requests before fetching all events
      // to ensure deletes are processed first
      processPendingRequests().then(() => {
        // Only after pending requests are processed, fetch all events
        // This ensures offline deletes are sent to the server before
        // we pull all events back down
        fetchEvents();
      });
    }
  }, [fetchEvents, isOnline, processPendingRequests]);

  // Process pending requests when online status changes
  useEffect(() => {
    console.log(`Online status changed: ${isOnline ? "ONLINE" : "OFFLINE"}`);

    if (isOnline) {
      console.log("Back online - processing pending requests");
      // Small delay to ensure network is stable
      const timer = setTimeout(() => {
        // Process pending requests first, then fetch all events
        processPendingRequests().then(() => {
          console.log("Pending requests processed, now fetching all events");
          fetchEvents();
        });
      }, 2000);

      return () => clearTimeout(timer);
    }

    // Update pending count
    const pendingCount = getPendingRequests().filter(
      (req) => req.table === "event"
    ).length;
    console.log(`Current pending count: ${pendingCount}`);
    setPendingSyncCount(pendingCount);
  }, [isOnline, processPendingRequests, fetchEvents]);

  // Custom setEvents function that handles storage
  const setEvents = useCallback((newEvents: CalendarEvent[]) => {
    setEventsState(newEvents);
    saveEventsToStorage(newEvents);
  }, []);

  // Add a new event
  const addEvent = useCallback(
    async (event: Omit<CalendarEvent, "id">) => {
      // Add timestamp for conflict resolution
      const timestamp = getCurrentTimestamp();

      // Extract only valid fields for the insert
      const {
        coach_id = "1", // Default coach_id to "1" if not provided
        event_type,
        event_name,
        event_date,
        duration,
        athlete_id = "1",
      } = event;

      // Create clean data with only valid fields
      const validEventData = {
        coach_id,
        event_type,
        event_name,
        event_date,
        duration,
        last_changed: timestamp,
        athlete_id,
      };

      // Generate a temporary unique ID for optimistic updates
      const tempId = `temp_${Date.now()}`;
      const tempEvent = {
        ...validEventData,
        id: tempId,
      } as CalendarEvent;

      // Optimistically update UI
      setEventsState((prev) => {
        const newEvents = [...prev, tempEvent];
        saveEventsToStorage(newEvents);
        // Notify listeners of the new event
        notifyListeners("add", tempEvent);
        return newEvents;
      });

      // Check network connection in real-time
      const isCurrentlyOnline = await checkNetworkConnection();

      if (isCurrentlyOnline) {
        try {
          console.log("Sending insert to Supabase with data:", validEventData);

          const { data, error } = await supabase
            .from("event")
            .insert(validEventData)
            .select();

          if (error) {
            console.error("Error adding event:", error);
            // Store for offline processing with tempId reference
            addPendingRequest({
              type: "insert",
              table: "event",
              data: { ...validEventData, tempId },
            });
            setPendingSyncCount((prev) => prev + 1);
          } else if (data && data.length > 0) {
            console.log("Successfully inserted event in Supabase:", data[0]);
            // Replace temp event with real one
            setEventsState((prev) => {
              const updated = prev.map((e) => {
                if (isMatchingTempId(e.id, tempId)) {
                  const finalEvent = data[0] as CalendarEvent;
                  // Notify about the resolved event with real ID
                  notifyListeners("update", finalEvent);
                  return finalEvent;
                }
                return e;
              });
              saveEventsToStorage(updated);
              return updated;
            });
          }
        } catch (error) {
          console.error("Failed to add event:", error);
          // Store for offline processing
          addPendingRequest({
            type: "insert",
            table: "event",
            data: { ...validEventData, tempId },
          });
          setPendingSyncCount((prev) => prev + 1);
        }
      } else {
        // Store for offline processing
        addPendingRequest({
          type: "insert",
          table: "event",
          data: { ...validEventData, tempId },
        });
        setPendingSyncCount((prev) => prev + 1);
      }
    },
    [notifyListeners]
  );

  // Update an existing event
  const updateEvent = useCallback(
    async (event: CalendarEvent) => {
      // Add timestamp for conflict resolution
      const timestamp = getCurrentTimestamp();

      // Filter event data to include only valid columns for the event table
      // This prevents errors from trying to update columns that don't exist
      const {
        id,
        coach_id,
        event_type,
        event_name,
        event_date,
        duration,
        athlete_id,
      } = event;

      // Only include fields that exist in the database
      const validEventData = {
        coach_id,
        event_type,
        event_name,
        event_date,
        duration,
        last_changed: timestamp,
        athlete_id,
      };

      // Optimistically update UI
      setEventsState((prev) => {
        const updated = prev.map((e) => {
          if (e.id === event.id) {
            const updatedEvent = {
              ...validEventData,
              id: e.id,
            } as CalendarEvent;
            notifyListeners("update", updatedEvent);
            return updatedEvent;
          }
          return e;
        });
        saveEventsToStorage(updated);
        return updated;
      });

      // Check network connection in real-time
      const isCurrentlyOnline = await checkNetworkConnection();

      if (isCurrentlyOnline) {
        try {
          console.log("Sending update to Supabase with data:", validEventData);

          const { data, error } = await supabase
            .from("event")
            .update(validEventData)
            .eq("id", event.id)
            .select();

          if (error) {
            console.error("Error updating event:", error);
            // Store for offline processing
            addPendingRequest({
              type: "update",
              table: "event",
              data: { ...validEventData, id: event.id },
            });
            setPendingSyncCount((prev) => prev + 1);
          } else if (data && data.length > 0) {
            console.log("Successfully updated event in Supabase:", data[0]);
            // Update with the server response to ensure we have the latest data
            setEventsState((prev) => {
              const updated = prev.map((e) => {
                if (e.id === event.id) {
                  const finalEvent = data[0] as CalendarEvent;
                  notifyListeners("update", finalEvent);
                  return finalEvent;
                }
                return e;
              });
              saveEventsToStorage(updated);
              return updated;
            });
          }
        } catch (error) {
          console.error("Failed to update event:", error);
          // Store for offline processing
          addPendingRequest({
            type: "update",
            table: "event",
            data: { ...validEventData, id: event.id },
          });
          setPendingSyncCount((prev) => prev + 1);
        }
      } else {
        // Store for offline processing
        addPendingRequest({
          type: "update",
          table: "event",
          data: { ...validEventData, id: event.id },
        });
        setPendingSyncCount((prev) => prev + 1);
      }
    },
    [notifyListeners]
  );

  // Delete an event
  const deleteEvent = useCallback(
    async (id: string | number) => {
      // Optimistically update UI
      setEventsState((prev) => {
        const filtered = prev.filter((e) => e.id !== id);
        saveEventsToStorage(filtered);
        notifyListeners("delete", { id } as CalendarEvent);
        return filtered;
      });

      // Check network connection in real-time
      const isCurrentlyOnline = await checkNetworkConnection();

      if (isCurrentlyOnline) {
        try {
          const { error } = await supabase.from("event").delete().eq("id", id);

          if (error) {
            console.error("Error deleting event:", error);
            // Store for offline processing
            addPendingRequest({ type: "delete", table: "event", data: { id } });
            setPendingSyncCount((prev) => prev + 1);
          }
        } catch (error) {
          console.error("Failed to delete event:", error);
          // Store for offline processing
          addPendingRequest({ type: "delete", table: "event", data: { id } });
          setPendingSyncCount((prev) => prev + 1);
        }
      } else {
        // Store for offline processing
        addPendingRequest({ type: "delete", table: "event", data: { id } });
        setPendingSyncCount((prev) => prev + 1);
      }
    },
    [notifyListeners]
  );

  return (
    <CalendarContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        addingEvent,
        setAddingEvent,
        eventInfo,
        setEventInfo,
        events,
        setEvents,
        addEvent,
        updateEvent,
        deleteEvent,
        isOnline,
        pendingSyncCount,
        addChangeListener,
        removeChangeListener,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = (): CalendarContextType => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error("useCalendar must be used within a CalendarProvider");
  }
  return context;
};
