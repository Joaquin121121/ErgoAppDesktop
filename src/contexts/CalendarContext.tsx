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

// Type definitions for event listeners
type ChangeType = "add" | "update" | "delete" | "sync";
type ChangeListener = (type: ChangeType, event?: CalendarEvent) => void;

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
  // Add change listener functions
  addChangeListener: (listener: ChangeListener) => void;
  removeChangeListener: (listener: ChangeListener) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined
);

// Helper to get current timestamp in ISO format
const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [addingEvent, setAddingEvent] = useState(false);
  const [eventInfo, setEventInfo] = useState<CalendarEvent | null>(null);
  const [events, setEventsState] = useState<CalendarEvent[]>([]);

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

  // Fetch events from database
  const fetchEvents = useCallback(async () => {
    try {
      console.log("Fetching all events from Supabase");
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
      setEventsState(data);
      notifyListeners("sync");
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  }, [notifyListeners]);

  // Setup Supabase realtime subscription
  useEffect(() => {
    console.log("Setting up realtime subscription for event table");

    // Create a single channel with multiple handlers for different operations
    const channel = supabase.channel("events-channel");

    // DELETE handler
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

              notifyListeners("delete", { id: deletedId } as CalendarEvent);
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

            // Create a new array with the updated event
            const updatedEvents = [
              ...prevEvents.slice(0, existingIndex),
              updatedEvent,
              ...prevEvents.slice(existingIndex + 1),
            ];

            notifyListeners("update", updatedEvent);
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

    // Initial fetch of events
    fetchEvents();

    // Cleanup on unmount
    return () => {
      console.log("Cleaning up Supabase realtime subscription");
      channel.unsubscribe();
    };
  }, [fetchEvents, notifyListeners]);

  // Simple setEvents function
  const setEvents = useCallback((newEvents: CalendarEvent[]) => {
    setEventsState(newEvents);
  }, []);

  // Add a new event
  const addEvent = useCallback(
    async (event: Omit<CalendarEvent, "id">) => {
      // Add timestamp for tracking
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

      try {
        console.log("Adding event to Supabase:", validEventData);

        const { data, error } = await supabase
          .from("event")
          .insert(validEventData)
          .select();

        if (error) {
          console.error("Error adding event:", error);
          throw error;
        }

        if (data && data.length > 0) {
          // Add the new event to state
          const newEvent = data[0] as CalendarEvent;
          setEventsState((prev) => [...prev, newEvent]);
          notifyListeners("add", newEvent);
          console.log("Successfully added event:", newEvent);
        }
      } catch (error) {
        console.error("Failed to add event:", error);
        throw error;
      }
    },
    [notifyListeners]
  );

  // Update an existing event
  const updateEvent = useCallback(
    async (event: CalendarEvent) => {
      // Add timestamp for tracking
      const timestamp = getCurrentTimestamp();

      // Filter event data to include only valid columns for the event table
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

      try {
        console.log("Updating event in Supabase:", validEventData);

        const { data, error } = await supabase
          .from("event")
          .update(validEventData)
          .eq("id", id)
          .select();

        if (error) {
          console.error("Error updating event:", error);
          throw error;
        }

        if (data && data.length > 0) {
          // Update the event in state
          const updatedEvent = data[0] as CalendarEvent;
          setEventsState((prev) =>
            prev.map((e) => (e.id === id ? updatedEvent : e))
          );
          notifyListeners("update", updatedEvent);
          console.log("Successfully updated event:", updatedEvent);
        }
      } catch (error) {
        console.error("Failed to update event:", error);
        throw error;
      }
    },
    [notifyListeners]
  );

  // Delete an event
  const deleteEvent = useCallback(
    async (id: string | number) => {
      try {
        console.log("Deleting event from Supabase:", id);

        const { error } = await supabase.from("event").delete().eq("id", id);

        if (error) {
          console.error("Error deleting event:", error);
          throw error;
        }

        // Remove the event from state
        setEventsState((prev) => prev.filter((e) => e.id !== id));
        notifyListeners("delete", { id } as CalendarEvent);
        console.log("Successfully deleted event:", id);
      } catch (error) {
        console.error("Failed to delete event:", error);
        throw error;
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
