import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { Event } from "../types/Events";
import {
  getEvents,
  addEvent as addEventDb,
  updateEvent as updateEventDb,
  deleteEvent as deleteEventDb,
} from "../parsers/eventsParser";
import { useUser } from "./UserContext";
import { v4 as uuidv4 } from "uuid";
import { useDatabaseSync } from "../hooks/useDatabaseSync";

interface CalendarContextType {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  addingEvent: boolean;
  setAddingEvent: (adding: boolean) => void;
  eventInfo: Event | null;
  setEventInfo: (event: Event | null) => void;
  events: Event[];
  setEvents: (events: Event[]) => void;
  addEvent: (event: Omit<Event, "id">) => Promise<void>;
  updateEvent: (event: Event) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined
);

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [addingEvent, setAddingEvent] = useState(false);
  const [eventInfo, setEventInfo] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const { user } = useUser();
  const { pushRecord } = useDatabaseSync();

  useEffect(() => {
    fetchEvents();
  }, [user.id]);

  const fetchEvents = async () => {
    try {
      const fetchedEvents = await getEvents(user.id);
      setEvents(fetchedEvents);
    } catch (error) {
      console.error(error);
    }
  };

  const addEvent = async (event: Omit<Event, "id">) => {
    try {
      const eventData = {
        ...event,
        id: uuidv4(),
      };
      await addEventDb(eventData, user.id, pushRecord);
      setEvents((prev) => [...prev, eventData]);
    } catch (error) {
      console.error(error);
    }
  };

  const updateEvent = async (event: Event) => {
    try {
      await updateEventDb(event, pushRecord);
      setEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
    } catch (error) {
      console.error(error);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await deleteEventDb(id, pushRecord);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

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
