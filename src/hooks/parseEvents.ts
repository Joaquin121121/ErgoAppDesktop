import Database from "@tauri-apps/plugin-sql";
import { v4 as uuidv4 } from "uuid";
import { CalendarEvent } from "../components/Calendar";

interface RawEvent {
  id: string;
  event_type: string;
  event_name: string;
  event_date: string;
  duration: number | null;
  last_changed: string;
  coach_id: string;
  deleted_at: string | null;
  created_at: string;
  athlete_id: string;
}

// Get all events for a coach
export const getEvents = async (coachId: string): Promise<CalendarEvent[]> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    const events = await db.select(
      `SELECT * FROM event 
       WHERE coach_id = ? AND deleted_at IS NULL 
       ORDER BY event_date DESC`,
      [coachId]
    );

    return events.map((event: RawEvent) => ({
      id: event.id,
      coach_id: event.coach_id,
      event_type: event.event_type as
        | "competition"
        | "trainingSession"
        | "testSession",
      event_name: event.event_name,
      event_date: event.event_date,
      duration: event.duration || undefined,
      last_changed: event.last_changed,
      athlete_id: event.athlete_id,
    }));
  } catch (error) {
    return [];
  }
};

// Save or update an event
export const saveEvent = async (
  event: Omit<CalendarEvent, "id"> & { id?: string },
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
        // Update existing event
        await dbToUse.execute(
          `UPDATE event 
           SET event_type = ?, event_name = ?, event_date = ?, 
               duration = ?, last_changed = ?, athlete_id = ?
           WHERE id = ? AND deleted_at IS NULL`,
          [
            event.event_type,
            event.event_name,
            event.event_date,
            event.duration || null,
            now,
            event.athlete_id,
            event.id,
          ]
        );
      } else {
        // Insert new event
        await dbToUse.execute(
          `INSERT INTO event (id, event_type, event_name, event_date, 
                             duration, last_changed, coach_id, athlete_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            eventId,
            event.event_type,
            event.event_name,
            event.event_date,
            event.duration || null,
            now,
            event.coach_id,
            event.athlete_id,
            now,
          ]
        );

        // Verify the event was inserted
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
    // Check if it's a foreign key constraint error
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

// Soft delete an event
export const deleteEvent = async (
  eventId: string | number,
  externalDb?: any
): Promise<{ success: boolean; error?: string }> => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    // Ensure eventId is a string
    const eventIdStr = eventId.toString();

    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    try {
      const now = new Date().toISOString();

      // First check if the event exists and is not already deleted
      const existingEvent = await dbToUse.select(
        "SELECT id, deleted_at FROM event WHERE id = ?",
        [eventIdStr]
      );

      if (existingEvent.length === 0) {
        throw new Error(`Event with ID ${eventIdStr} not found in database`);
      }

      if (existingEvent[0].deleted_at !== null) {
        throw new Error(`Event with ID ${eventIdStr} is already deleted`);
      }

      // Soft delete the event
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

// Get events for a specific athlete
export const getEventsByAthlete = async (
  athleteId: string,
  coachId: string
): Promise<CalendarEvent[]> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    const events = await db.select(
      `SELECT * FROM event 
       WHERE athlete_id = ? AND coach_id = ? AND deleted_at IS NULL 
       ORDER BY event_date DESC`,
      [athleteId, coachId]
    );

    return events.map((event: RawEvent) => ({
      id: event.id,
      coach_id: event.coach_id,
      event_type: event.event_type as
        | "competition"
        | "trainingSession"
        | "testSession",
      event_name: event.event_name,
      event_date: event.event_date,
      duration: event.duration || undefined,
      last_changed: event.last_changed,
      athlete_id: event.athlete_id,
    }));
  } catch (error) {
    return [];
  }
};

// Batch save multiple events
export const saveAllEvents = async (data: {
  events: (Omit<CalendarEvent, "id"> & { id?: string })[];
  coachId: string;
}): Promise<{ success: boolean; results: any[]; error?: string }> => {
  if (!data || !data.events || !data.coachId) {
    return {
      success: false,
      error: "Invalid input: events array and coachId are required.",
      results: [],
    };
  }

  if (data.events.length === 0) {
    return { success: true, results: [] };
  }

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
          error: `Failed to save event ${i} (${event.event_name}): ${result.error}`,
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

// Check if a coach exists in the database
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

// Check if an athlete exists in the database
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

// Delete all events for a specific athlete
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

      // Get all events for this athlete that aren't already deleted
      const athleteEvents = await dbToUse.select(
        "SELECT id FROM event WHERE athlete_id = ? AND deleted_at IS NULL",
        [athleteId]
      );

      if (athleteEvents.length > 0) {
        // Soft delete all events for this athlete
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
