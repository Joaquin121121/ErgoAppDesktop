import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { CalendarEvent } from "../components/Calendar";
import {
  getEvents,
  saveEvent as saveEventDb,
  deleteEvent as deleteEventDb,
  checkCoachExists,
} from "../hooks/parseEvents";
import Database from "@tauri-apps/plugin-sql";

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
  // Coach ID for the current user
  coachId: string;
  setCoachId: (id: string) => void;
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
  const [coachId, setCoachId] = useState<string>(
    "650cbaf0-8953-4412-a4dd-16f31f55bd45"
  ); // Default coach ID

  // Add change listeners for components that need to react to event changes
  const [changeListeners, setChangeListeners] = useState<ChangeListener[]>([]);

  // Initialize coach on mount
  useEffect(() => {
    const initializeCoach = async () => {
      // Check if the default coach exists
      const coachExists = await checkCoachExists(coachId);

      if (!coachExists) {
        try {
          const db = await (Database as any).load("sqlite:ergolab.db");

          // Create a default coach
          await db.execute(
            `INSERT INTO coach (id, email, first_name, last_name, info, specialty, created_at, last_changed)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              coachId,
              "default@ergoapp.com",
              "Default",
              "Coach",
              "Default coach for the system",
              "General",
              new Date().toISOString(),
              new Date().toISOString(),
            ]
          );
        } catch (error) {}
      }
    };

    initializeCoach();
  }, [coachId]);

  // Helper to notify all listeners of a change
  const notifyListeners = useCallback(
    (type: ChangeType, event?: CalendarEvent) => {
      changeListeners.forEach((listener) => {
        try {
          listener(type, event);
        } catch (error) {}
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
      const fetchedEvents = await getEvents(coachId);
      setEventsState(fetchedEvents);
      notifyListeners("sync");
    } catch (error) {}
  }, [coachId, notifyListeners]);

  // Initial fetch of events and periodic refresh
  useEffect(() => {
    fetchEvents();

    // Refresh events every 30 seconds
    const interval = setInterval(fetchEvents, 30000);

    return () => clearInterval(interval);
  }, [fetchEvents]);

  // Simple setEvents function
  const setEvents = useCallback((newEvents: CalendarEvent[]) => {
    setEventsState(newEvents);
  }, []);

  // Add a new event
  const addEvent = useCallback(
    async (event: Omit<CalendarEvent, "id">) => {
      // Add timestamp for tracking
      const timestamp = getCurrentTimestamp();

      // Create event data with coach_id
      const eventData = {
        ...event,
        coach_id: coachId,
        last_changed: timestamp,
      };

      try {
        const result = await saveEventDb(eventData);

        if (result.success && result.id) {
          // Create the new event with the generated ID
          const newEvent: CalendarEvent = {
            ...eventData,
            id: result.id,
          };

          // Add the new event to state
          setEventsState((prev) => [...prev, newEvent]);
          notifyListeners("add", newEvent);

          // Refresh events from database to ensure consistency
          setTimeout(() => {
            fetchEvents();
          }, 100);
        } else {
          throw new Error(result.error || "Failed to add event");
        }
      } catch (error) {
        throw error;
      }
    },
    [coachId, notifyListeners, fetchEvents]
  );

  // Update an existing event
  const updateEvent = useCallback(
    async (event: CalendarEvent) => {
      // Add timestamp for tracking
      const timestamp = getCurrentTimestamp();

      // Create updated event data
      const updatedEventData = {
        ...event,
        last_changed: timestamp,
      };

      try {
        const result = await saveEventDb(updatedEventData);

        if (result.success) {
          // Update the event in state
          setEventsState((prev) =>
            prev.map((e) => (e.id === event.id ? updatedEventData : e))
          );
          notifyListeners("update", updatedEventData);
        } else {
          throw new Error(result.error || "Failed to update event");
        }
      } catch (error) {
        throw error;
      }
    },
    [notifyListeners]
  );

  // Delete an event
  const deleteEvent = useCallback(
    async (id: string | number) => {
      try {
        const result = await deleteEventDb(id);

        if (result.success) {
          // Remove the event from state
          setEventsState((prev) => prev.filter((e) => e.id !== id));
          notifyListeners("delete", { id } as CalendarEvent);
        } else {
          throw new Error(result.error || "Failed to delete event");
        }
      } catch (error) {
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
        coachId,
        setCoachId,
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
