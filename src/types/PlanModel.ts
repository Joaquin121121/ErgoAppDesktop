import { Session } from "./trainingPlan";

interface PlanModel {
  id: string;
  name: string;
  description: string;
  sessions: Session[];
}
