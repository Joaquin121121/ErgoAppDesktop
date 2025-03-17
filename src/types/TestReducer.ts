// types/Tests/TestReducer.ts

import {
  JumpTime,
  StudyData,
  MultipleAthletesTest,
  DropJumpResult,
} from "./Studies";

// State interface
export interface TestState {
  status:
    | "idle"
    | "ready"
    | "jumping"
    | "finished"
    | "deviceError"
    | "noJumpsError";
  jumpTimes: JumpTime[];
  data: StudyData;
  startTime: Date;
  ignoreJump: boolean;
  displayError: boolean;
  showTable: boolean;
  showChart: boolean;
  performanceDrop: number;
  multipleAthletesTests: MultipleAthletesTest[];
  pointer: number;
  selectedAthletePointer: number;
  sensitivity: number;
  testType: "standard" | "multipleDropJump" | "multipleJumps" | null;
  dropJumps: DropJumpResult[];
  selectedAthletes: string[];
  firstJumpFlag: boolean;
  // Add other state properties as needed
}

// Action types
export type TestAction =
  | { type: "SET_STATUS"; payload: TestState["status"] }
  | { type: "DELETE_JUMP"; payload: { index: number } }
  | { type: "FINISH_TEST" }
  | { type: "RESET_TEST" }
  | { type: "SET_IGNORE_JUMP"; payload: boolean }
  | { type: "TOGGLE_TABLE"; payload: boolean }
  | { type: "TOGGLE_CHART"; payload: boolean }
  | { type: "PROCESS_LOG"; payload: { logData: number; timestamp: Date } }
  | { type: "CALCULATE_AVERAGES" };
