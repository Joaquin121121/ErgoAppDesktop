import React from "react";

// Type definitions for training plans
export type DayName = string;

export interface Progression {
  series: number;
  repetitions: string;
  effort: number;
}

export interface VolumeReduction {
  [fatigueLevel: string]: number;
}

export interface EffortReduction {
  [effortLevel: string]: number;
}

export interface TrainingBlock {
  name: string;
  seriesN: number;
  reps: string;
  effort: number;
  fatigueManagement: boolean;
  reduceVolume?: VolumeReduction;
  reduceEffort?: EffortReduction;
  exercisesInSeries: string[];
  blockModel: string;
  progression: Progression[];
  comments: string;
}

export interface Session {
  name: string;
  days: DayName[];
  trainingBlocks: TrainingBlock[];
}

export interface PlanState {
  nOfWeeks: number;
  modelId: string;
  sessions: Session[];
  nOfSessions: number;
}

export interface NewPlanContextType {
  planState: PlanState;
  setPlanState: React.Dispatch<React.SetStateAction<PlanState>>;
  updateWeeks: (weeks: number) => void;
  toggleUseAsModel: () => void;
  updateModelId: (id: string) => void;
  updateModelName: (name: string) => void;
  addSession: () => void;
  updateSession: (index: number, session: Session) => void;
  removeSession: (index: number) => void;
  addTrainingBlock: (sessionIndex: number) => void;
  updateTrainingBlock: (
    sessionIndex: number,
    blockIndex: number,
    block: TrainingBlock
  ) => void;
  removeTrainingBlock: (sessionIndex: number, blockIndex: number) => void;
  resetPlan: () => void;
  updateNOfSessions: (n: number) => void;
}

// Default values
export const defaultTrainingBlock: TrainingBlock = {
  name: "",
  seriesN: 3,
  reps: "8-12",
  effort: 70,
  fatigueManagement: false,
  exercisesInSeries: [],
  blockModel: "",
  progression: [],
  comments: "",
};

export const defaultSession: Session = {
  name: "",
  days: [],
  trainingBlocks: [],
};

export const defaultPlanState: PlanState = {
  nOfWeeks: 4,
  modelId: "",
  sessions: [],
  nOfSessions: 0,
};
