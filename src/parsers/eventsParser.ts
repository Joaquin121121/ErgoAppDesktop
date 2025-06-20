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
          athleteId: event.athlete_id,
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
                           duration, last_changed, coach_id, athlete_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          eventId,
          event.eventType,
          event.name,
          event.date,
          event.duration || null,
          now,
          coachId,
          event.athleteId,
          now,
        ]
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
          event.athleteId,
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

    const events = await db.select(
      `SELECT * FROM event 
       WHERE athlete_id = ? AND coach_id = ? AND deleted_at IS NULL 
       ORDER BY event_date DESC`,
      [athleteId, coachId]
    );

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
          athleteId: event.athlete_id,
        } as Event)
    );
  } catch (error) {
    console.error(error);
    return [];
  }
};
