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

export interface DisplayProgressionCollection {
  [id: string]: DisplayProgression[];
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
  series: number;
  repetitions: string;
  effort: number;
  reduceVolume?: VolumeReduction;
  reduceEffort?: EffortReduction;
  restTime: number;
  progression: Progression[];
  comments: string;
  blockId?: string;
  last_changed?: string;
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
  series: number;
  repetitions: string;
  effort: number;
  reduceVolume?: VolumeReduction;
  reduceEffort?: EffortReduction;
  selectedExercises: SelectedExercise[]; //Dont include in db schema
  exercisesInSeries: SelectedExercise[]; //Dont include in db schema
  blockModel: "sequential" | "series";
  progression: Progression[];
  comments: string;
  restTime: number;
  last_changed?: string;
}

export interface Session {
  id: string;
  planId: string;
  name: string;
  days: DayName[];
  exercises: (SelectedExercise | TrainingBlock)[];
  last_changed?: string;
}

export interface PlanState {
  id: string;
  nOfWeeks: number;
  sessions: Session[];
  nOfSessions: number;
  last_changed?: string;
}

export interface TrainingModel extends PlanState {
  name: string;
  description: string;
  trainingPlanId?: string; // Reference to the underlying training plan ID
}

export interface RangeEntry {
  range: number[];
  percentageDrop: number;
}

export interface NewPlanContextType {
  planState: PlanState;
  setPlanState: React.Dispatch<React.SetStateAction<PlanState>>;
  updateWeeks: (weeks: number, isModel?: boolean) => void;
  linkTrainingPlanToModel: (planId: string, modelId: string) => Promise<void>;
  unlinkTrainingPlanFromModel: (
    planId: string,
    modelId: string
  ) => Promise<void>;
  addSession: (
    session: Omit<Session, "id" | "planId">,
    isModel?: boolean
  ) => Promise<PlanState | TrainingModel>;
  updateSession: (
    index: number,
    session: Omit<Session, "id" | "planId">,
    isModel?: boolean
  ) => Promise<PlanState | TrainingModel>;
  removeSession: (index: number, isModel?: boolean) => void;
  addTrainingBlock: (
    sessionIndex: number,
    exerciseData: Exercise[],
    selectedExercise: SelectedExercise, //contains the default data for the block
    blockModel: "sequential" | "series",
    isModel?: boolean
  ) => void;

  updateTrainingBlock: (
    sessionIndex: number,
    exerciseId: string,
    block: TrainingBlock,
    isModel?: boolean
  ) => void;
  removeExercise: (
    sessionIndex: number,
    exerciseId: string,
    blockId?: string,
    isModel?: boolean
  ) => void;
  resetPlan: () => void;
  updateNOfSessions: (n: number, isModel?: boolean) => void;
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
    currentSelectedExercise: SelectedExercise,
    isModel?: boolean
  ) => void;
  model: TrainingModel;
  setModel: React.Dispatch<React.SetStateAction<TrainingModel>>;
  resetModelState: () => void;
  updateExerciseProperty: (
    sessionIndex: number,
    exerciseId: string,
    property: keyof SelectedExercise,
    value: any,
    blockId?: string,
    isModel?: boolean
  ) => void;
  updateExerciseProgression: (
    sessionIndex: number,
    exerciseId: string,
    weekIndex: number,
    field: keyof Progression,
    value: string | number,
    blockId?: string,
    isModel?: boolean
  ) => void;
  // Manual save functions
  saveNewTrainingPlan: (updatedPlan?: PlanState) => Promise<void>;
  saveNewTrainingModel: (updatedModel?: TrainingModel) => Promise<void>;
  // New boolean flags to track if model/plan are new
  isNewModel: boolean;
  isNewTrainingPlan: boolean;
  setIsNewModel: React.Dispatch<React.SetStateAction<boolean>>;
  setIsNewTrainingPlan: React.Dispatch<React.SetStateAction<boolean>>;
  // Expose sync functionality
  syncStats: any;
  isProcessing: boolean;
  forceSyncAll: () => void;
  // Model metadata update functions
  updateModelName: (name: string) => Promise<void>;
  updateModelDescription: (description: string) => Promise<void>;
}

// Default values
export const defaultTrainingBlock: TrainingBlock = {
  id: "",
  type: "trainingBlock",
  sessionId: "",
  name: "",
  series: 3,
  repetitions: "8-12",
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
