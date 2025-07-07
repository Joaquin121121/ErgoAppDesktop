import Database from "@tauri-apps/plugin-sql";
import { v4 as uuidv4 } from "uuid";
import { Event, RawEvent } from "../types/Events";
import { PendingRecord } from "@/types/Sync";

export const getEvents = async (coachId: string): Promise<Event[]> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    const events = await db.select(
      `SELECT * FROM event 
       WHERE coach_id = ? AND deleted_at IS NULL 
       ORDER BY event_date DESC`,
      [coachId]
    );
    const eventIds = events.map((event) => event.id);
    const placeholders = eventIds.map(() => "?").join(", ");

    const eventsAthletes = await db.select(
      `SELECT ea.* 
   FROM events_athletes ea
   WHERE ea.deleted_at IS NULL AND ea.event_id IN (${placeholders})`,
      eventIds
    );

    const eventAthleteMap = new Map<string, string[]>();

    eventsAthletes.forEach((ea: any) => {
      if (!eventAthleteMap.has(ea.event_id)) {
        eventAthleteMap.set(ea.event_id, []);
      }
      eventAthleteMap.get(ea.event_id)!.push(ea.athlete_id);
    });

    return events.map(
      (event: RawEvent) =>
        ({
          id: event.id,
          eventType: event.event_type as
            | "competition"
            | "test"
            | "trainingSession",
          name: event.event_name,
          date: new Date(event.event_date),
          duration: event.duration || undefined,
          athleteIds: eventAthleteMap.get(event.id) || [],
        } as Event)
    );
  } catch (error) {
    return [];
  }
};

export const addEvent = async (
  event: Omit<Event, "id">,
  coachId: string,
  pushRecord: (records: PendingRecord[]) => Promise<void>,
  externalDb?: any
): Promise<PendingRecord> => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    try {
      const eventId = uuidv4();
      const now = new Date().toISOString();

      await dbToUse.execute(
        `INSERT INTO event (id, event_type, event_name, event_date, 
                           duration, last_changed, coach_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          eventId,
          event.eventType,
          event.name,
          event.date,
          event.duration || null,
          now,
          coachId,
          now,
        ]
      );

      await dbToUse.execute(
        `INSERT INTO events_athletes (id, event_id, athlete_id, created_at)
         VALUES (?, ?, ?, ?)`,
        [uuidv4(), eventId, event.athleteIds[0], now]
      );

      if (isManagingTransaction) {
        await dbToUse.execute("COMMIT");
        pushRecord([{ tableName: "event", id: eventId }]);
      } else {
        return { tableName: "event", id: eventId };
      }
    } catch (innerError) {
      if (isManagingTransaction) {
        await dbToUse.execute("ROLLBACK");
      }
      throw innerError;
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateEvent = async (
  event: Event,
  pushRecord: (records: PendingRecord[]) => Promise<void>,
  externalDb?: any
): Promise<PendingRecord> => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    try {
      const now = new Date().toISOString();

      await dbToUse.execute(
        `UPDATE event 
         SET event_type = ?, event_name = ?, event_date = ?, 
             duration = ?, last_changed = ?, athlete_id = ?
         WHERE id = ? AND deleted_at IS NULL`,
        [
          event.eventType,
          event.name,
          event.date,
          event.duration || null,
          now,
          event.athleteIds,
          event.id,
        ]
      );

      if (isManagingTransaction) {
        await dbToUse.execute("COMMIT");
        pushRecord([{ tableName: "event", id: event.id }]);
      } else {
        return { tableName: "event", id: event.id };
      }
    } catch (innerError) {
      if (isManagingTransaction) {
        await dbToUse.execute("ROLLBACK");
      }
      throw innerError;
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteEvent = async (
  eventId: string,
  pushRecord: (records: PendingRecord[]) => Promise<void>,
  externalDb?: any
): Promise<PendingRecord> => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    try {
      const now = new Date().toISOString();
      const result = await dbToUse.execute(
        "UPDATE event SET deleted_at = ?, last_changed = ? WHERE id = ?",
        [now, now, eventId]
      );
      console.log("Result", result);

      if (isManagingTransaction) {
        await dbToUse.execute("COMMIT");
        pushRecord([{ tableName: "event", id: eventId }]);
      } else {
        return { tableName: "event", id: eventId };
      }
    } catch (innerError) {
      if (isManagingTransaction) {
        await dbToUse.execute("ROLLBACK");
      }
      console.error(innerError);
      throw innerError;
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getEventsByAthlete = async (
  athleteId: string,
  coachId: string,
  externalDb?: any
): Promise<Event[]> => {
  try {
    const db =
      externalDb || (await (Database as any).load("sqlite:ergolab.db"));

    // Get events through the events_athletes junction table
    const events = await db.select(
      `SELECT e.* 
       FROM event e
       INNER JOIN events_athletes ea ON e.id = ea.event_id
       WHERE ea.athlete_id = ? AND e.coach_id = ? AND e.deleted_at IS NULL AND ea.deleted_at IS NULL
       ORDER BY e.event_date DESC`,
      [athleteId, coachId]
    );

    const eventIds = events.map((event) => event.id);

    if (eventIds.length === 0) {
      return [];
    }

    const placeholders = eventIds.map(() => "?").join(", ");

    // Get all athletes for these events
    const eventsAthletes = await db.select(
      `SELECT ea.* 
       FROM events_athletes ea
       WHERE ea.deleted_at IS NULL AND ea.event_id IN (${placeholders})`,
      eventIds
    );

    // Create a map with event_id as key and array of athlete_ids as value
    const eventAthleteMap = new Map<string, string[]>();

    eventsAthletes.forEach((ea: any) => {
      if (!eventAthleteMap.has(ea.event_id)) {
        eventAthleteMap.set(ea.event_id, []);
      }
      eventAthleteMap.get(ea.event_id)!.push(ea.athlete_id);
    });

    return events.map(
      (event: RawEvent) =>
        ({
          id: event.id,
          eventType: event.event_type as
            | "competition"
            | "test"
            | "trainingSession",
          name: event.event_name,
          date: new Date(event.event_date),
          duration: event.duration || undefined,
          athleteIds: eventAthleteMap.get(event.id) || [],
        } as Event)
    );
  } catch (error) {
    console.error(error);
    return [];
  }
};
