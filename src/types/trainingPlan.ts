import React from "react";

// Type definitions for training plans
export type DayName = string;

export interface Progression {
  series: number;
  repetitions: string;
  effort: number;
}

export interface DisplayProgression {
  series: string;
  repetitions: string;
  effort: string;
}

export interface Exercise {
  id: string;
  name: string;
  videoRef: string;
}

export interface SelectedExercise {
  type: "selectedExercise"; // Not to be included in db schema
  id: string;
  sessionId: string;
  name: string; // Not to be included in db schema
  exerciseId: string;
  seriesN: number;
  reps: string;
  effort: number;
  reduceVolume?: VolumeReduction;
  reduceEffort?: EffortReduction;
  restTime: number;
  progression: Progression[];
  comments: string;
  blockId?: string;
}

export interface VolumeReduction {
  [fatigueLevel: string]: number;
}

export interface EffortReduction {
  [effortLevel: string]: number;
}

export interface TrainingBlock {
  type: "trainingBlock";
  id: string;
  sessionId: string;
  name: string;
  seriesN: number;
  reps: string;
  effort: number;
  reduceVolume?: VolumeReduction;
  reduceEffort?: EffortReduction;
  selectedExercises: SelectedExercise[]; //Dont include in db schema
  exercisesInSeries: SelectedExercise[]; //Dont include in db schema
  blockModel: "sequential" | "series";
  progression: Progression[];
  comments: string;
  restTime: number;
}

export interface Session {
  id: string;
  planId: string;
  name: string;
  days: DayName[];
  exercises: (SelectedExercise | TrainingBlock)[];
}

export interface PlanState {
  id: string;
  nOfWeeks: number;
  modelId: string;
  sessions: Session[];
  nOfSessions: number;
}
export interface RangeEntry {
  range: number[];
  percentageDrop: number;
}

export interface NewPlanContextType {
  planState: PlanState;
  setPlanState: React.Dispatch<React.SetStateAction<PlanState>>;
  updateWeeks: (weeks: number) => void;
  toggleUseAsModel: () => void;
  updateModelId: (id: string) => void;
  addSession: (session: Omit<Session, "id" | "planId">) => void;
  updateSession: (
    index: number,
    session: Omit<Session, "id" | "planId">
  ) => void;
  removeSession: (index: number) => void;
  addTrainingBlock: (
    sessionIndex: number,
    exerciseData: Exercise[],
    selectedExercise: SelectedExercise, //contains the default data for the block
    blockModel: "sequential" | "series"
  ) => void;

  updateTrainingBlock: (
    sessionIndex: number,
    exerciseId: string,
    block: TrainingBlock
  ) => void;
  removeExercise: (
    sessionIndex: number,
    exerciseId: string,
    blockId?: string
  ) => void;
  resetPlan: () => void;
  updateNOfSessions: (n: number) => void;
  currentExerciseBlock: TrainingBlock | null;
  setCurrentExerciseBlock: React.Dispatch<
    React.SetStateAction<TrainingBlock | null>
  >;
  currentSelectedExercise: SelectedExercise | null;
  setCurrentSelectedExercise: React.Dispatch<
    React.SetStateAction<SelectedExercise | null>
  >;
  saveSelectedExercise: (
    sessionIndex: number,
    currentSelectedExercise: SelectedExercise
  ) => void;
}

// Default values
export const defaultTrainingBlock: TrainingBlock = {
  id: "",
  type: "trainingBlock",
  sessionId: "",
  name: "",
  seriesN: 3,
  reps: "8-12",
  effort: 70,
  reduceVolume: {},
  reduceEffort: {},
  selectedExercises: [],
  exercisesInSeries: [],
  blockModel: "sequential",
  progression: [],
  comments: "",
  restTime: 60,
};

export const defaultSession: Session = {
  id: "",
  planId: "",
  name: "",
  days: [],
  exercises: [],
};

export const defaultPlanState: PlanState = {
  id: "",
  nOfWeeks: 4,
  modelId: "",
  sessions: [],
  nOfSessions: 0,
};

export const defaultProgression: Progression[] = [
  {
    series: 3,
    repetitions: "6-8",
    effort: 80,
  },
  {
    series: 3,
    repetitions: "8-10",
    effort: 85,
  },
  {
    series: 3,
    repetitions: "10-12",
    effort: 90,
  },
  {
    series: 3,
    repetitions: "12-14",
    effort: 95,
  },
  {
    series: 3,
    repetitions: "14-16",
    effort: 100,
  },
  {
    series: 4,
    repetitions: "14-16",
    effort: 100,
  },
];
