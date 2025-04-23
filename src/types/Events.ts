export interface Event {
  name: string;
  date: Date;
  duration: number;
  eventType: "competition" | "test" | "trainingSession";
}
