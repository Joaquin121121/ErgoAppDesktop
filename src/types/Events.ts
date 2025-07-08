export type EventType = "competition" | "testSession" | "trainingSession";

export interface Event {
  id: string;
  eventType: EventType;
  name: string;
  date: Date;
  duration?: number;
  athleteIds: string[];
}
export interface RawEvent {
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
