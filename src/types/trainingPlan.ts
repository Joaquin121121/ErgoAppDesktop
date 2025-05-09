import React from "react";

// Type definitions for training plans
export type DayName = string;

export interface Progression {
  series: number;
  repetitions: string;
  effort: number;
}

export interface Exercise {
  id: string;
  name: string;
  videoRef: string;
}

export interface SelectedExercise {
  type: "selectedExercise"; // Not to be included in db schema
  id: string;
  name: string; // Not to be included in db schema
  exerciseId: string;
  seriesN: number;
  reps: string;
  effort: number;
  reduceVolume: VolumeReduction;
  reduceEffort: EffortReduction;
  restTime: number;
  progression: Progression[];
}

export interface VolumeReduction {
  [fatigueLevel: string]: number;
}

export interface EffortReduction {
  [effortLevel: string]: number;
}

export interface TrainingBlock {
  id: string;
  type: "trainingBlock";
  name: string;
  seriesN: number;
  reps: string;
  effort: number;
  fatigueManagement: boolean;
  reduceVolume?: VolumeReduction;
  reduceEffort?: EffortReduction;
  exercisesInSeries: SelectedExercise[];
  blockModel: string;
  progression: Progression[];
  comments: string;
  restTime: number;
}

export interface Session {
  name: string;
  days: DayName[];
  exercises: (SelectedExercise | TrainingBlock)[];
}

export interface PlanState {
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
  addSession: (session: Session) => void;
  updateSession: (index: number, session: Session) => void;
  removeSession: (index: number) => void;
  addTrainingBlock: (sessionIndex: number) => void;
  addExercise: (
    sessionIndex: number,
    series: number,
    reps: string,
    fatigueParameter: "volume" | "effort" | null,
    handleFatigue: VolumeReduction | EffortReduction | undefined,
    effort: number,
    exerciseId: string,
    name: string,
    restTime: number,
    progression: Progression[]
  ) => void;
  updateTrainingBlock: (
    sessionIndex: number,
    exerciseId: string,
    block: TrainingBlock
  ) => void;
  removeExercise: (sessionIndex: number, exerciseId: string) => void;
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
  saveExerciseBlock: (sessionIndex: number) => void;
  saveSelectedExercise: (
    sessionIndex: number,
    currentSelectedExercise: SelectedExercise
  ) => void;
}

// Default values
export const defaultTrainingBlock: TrainingBlock = {
  id: "",
  type: "trainingBlock",
  name: "",
  seriesN: 3,
  reps: "8-12",
  effort: 70,
  fatigueManagement: false,
  exercisesInSeries: [],
  blockModel: "",
  progression: [],
  comments: "",
  restTime: 60,
};

export const defaultSession: Session = {
  name: "",
  days: [],
  exercises: [],
};

export const defaultPlanState: PlanState = {
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
];
