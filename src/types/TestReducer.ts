// types/Tests/TestReducer.ts

import {
  JumpTime,
  StudyData,
  MultipleAthletesTest,
  DropJumpResult,
  AbalakovResult,
  CMJResult,
  SquatJumpResult,
  LoadUnit,
  HeightUnit,
} from "./Studies";

import { Athlete } from "./Athletes";

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
  dropJumpHeights: string[];
  startTime: Date;
  ignoreJump: boolean;
  displayError: boolean;
  showTable: boolean;
  showChart: boolean;
  performanceDrop: number;
  takeoffFoot: "right" | "left" | "both";
  multipleAthletesTests: MultipleAthletesTest[];
  testPointer: number;
  athletePointer: number;
  sensitivity: number;
  testType:
    | "cmj"
    | "abalakov"
    | "squatJump"
    | "multipleDropJump"
    | "multipleJumps"
    | "bosco";
  dropJumps: DropJumpResult[];
  boscoResults: {
    cmj: CMJResult | null;
    squatJump: SquatJumpResult | null;
    abalakov: AbalakovResult | null;
  };
  selectedAthletes: Athlete[];
  firstJumpFlag: boolean;
  criterion: "time" | "numberOfJumps";
  criterionValue: number;
  avgFlightTime: number;
  avgHeightReached: number;
  avgStiffness: number;
  avgPerformance: number;
  avgFloorTime: number;
  load: number;
  loadUnit: LoadUnit;
  heightUnit: HeightUnit;
  maxAvgHeightReached: number;
  bestHeight: string;
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
  | { type: "CALCULATE_AVERAGES" }
  | { type: "NEXT_ATHLETE" }
  | { type: "PREVIOUS_ATHLETE" }
  | { type: "NEXT_TEST" }
  | { type: "PREVIOUS_TEST" };
