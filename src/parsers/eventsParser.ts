import Database from "@tauri-apps/plugin-sql";
import { v4 as uuidv4 } from "uuid";
import { Event, RawEvent } from "../types/Events";

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

export const saveEvent = async (
  event: Event,
  coachId: string,
  externalDb?: any
): Promise<{ success: boolean; id?: string; error?: string }> => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    try {
      const eventId = event.id || uuidv4();
      const now = new Date().toISOString();

      if (event.id) {
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
      } else {
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

        const verifyResult = await dbToUse.select(
          "SELECT id FROM event WHERE id = ?",
          [eventId]
        );

        if (verifyResult.length === 0) {
          throw new Error("Event was not properly inserted into database");
        }
      }

      if (isManagingTransaction) {
        await dbToUse.execute("COMMIT");
      }

      return { success: true, id: eventId };
    } catch (innerError) {
      if (isManagingTransaction) {
        await dbToUse.execute("ROLLBACK");
      }
      throw innerError;
    }
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("FOREIGN KEY constraint failed") ||
        error.message.includes("787"))
    ) {
      return {
        success: false,
        error:
          "The selected athlete or coach does not exist in the database. Please ensure the athlete is properly saved before creating an event.",
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const deleteEvent = async (
  eventId: string | number,
  externalDb?: any
): Promise<{ success: boolean; error?: string }> => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    const eventIdStr = eventId.toString();

    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    try {
      const now = new Date().toISOString();
      await dbToUse.execute(
        "UPDATE event SET deleted_at = ?, last_changed = ? WHERE id = ?",
        [now, now, eventIdStr]
      );

      if (isManagingTransaction) {
        await dbToUse.execute("COMMIT");
      }

      return { success: true };
    } catch (innerError) {
      if (isManagingTransaction) {
        await dbToUse.execute("ROLLBACK");
      }
      throw innerError;
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
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
    return [];
  }
};

export const saveAllEvents = async (data: {
  events: Event[];
  coachId: string;
}): Promise<{ success: boolean; results: any[]; error?: string }> => {
  const db = await (Database as any).load("sqlite:ergolab.db");

  try {
    await db.execute("BEGIN TRANSACTION");

    const operationResults = [];
    for (let i = 0; i < data.events.length; i++) {
      const event = { ...data.events[i], coach_id: data.coachId };

      const result = await saveEvent(event, db);

      if (!result.success) {
        await db.execute("ROLLBACK");
        return {
          success: false,
          error: `Failed to save event ${i} (${event.name}): ${result.error}`,
          results: operationResults,
        };
      }

      operationResults.push({ success: true, eventId: result.id });
    }

    await db.execute("COMMIT");
    return { success: true, results: operationResults };
  } catch (error) {
    try {
      await db.execute("ROLLBACK");
    } catch (rollbackError) {}
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown critical error occurred",
      results: [],
    };
  }
};

export const checkCoachExists = async (coachId: string): Promise<boolean> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");
    const result = await db.select(
      "SELECT id FROM coach WHERE id = ? AND deleted_at IS NULL",
      [coachId]
    );
    return result.length > 0;
  } catch (error) {
    return false;
  }
};

export const checkAthleteExists = async (
  athleteId: string
): Promise<boolean> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");
    const result = await db.select(
      "SELECT id FROM athlete WHERE id = ? AND deleted_at IS NULL",
      [athleteId]
    );
    return result.length > 0;
  } catch (error) {
    return false;
  }
};

export const deleteEventsForAthlete = async (
  athleteId: string,
  externalDb?: any
): Promise<{ success: boolean; deletedCount: number; error?: string }> => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    try {
      const now = new Date().toISOString();

      const athleteEvents = await dbToUse.select(
        "SELECT id FROM event WHERE athlete_id = ? AND deleted_at IS NULL",
        [athleteId]
      );

      if (athleteEvents.length > 0) {
        await dbToUse.execute(
          "UPDATE event SET deleted_at = ?, last_changed = ? WHERE athlete_id = ? AND deleted_at IS NULL",
          [now, now, athleteId]
        );
      }

      if (isManagingTransaction) {
        await dbToUse.execute("COMMIT");
      }

      return {
        success: true,
        deletedCount: athleteEvents.length,
      };
    } catch (innerError) {
      if (isManagingTransaction) {
        await dbToUse.execute("ROLLBACK");
      }
      throw innerError;
    }
  } catch (error) {
    return {
      success: false,
      deletedCount: 0,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
