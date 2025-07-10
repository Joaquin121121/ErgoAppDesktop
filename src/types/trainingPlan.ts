import React from "react";

export interface RawTrainingPlan {
  id: string;
  n_of_weeks: number;
  n_of_sessions: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RawTrainingModel {
  id: string;
  name: string;
  description: string | null;
  training_plan_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RawSession {
  id: string;
  plan_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RawSessionDay {
  id: string;
  session_id: string;
  day_name: string;
  created_at: string;
  deleted_at: string | null;
}

export interface RawTrainingBlock {
  id: string;
  session_id: string;
  name: string;
  series: number;
  repetitions: string;
  effort: number;
  block_model: "sequential" | "series";
  comments: string | null;
  rest_time: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RawSelectedExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  block_id: string | null;
  series: number;
  repetitions: string;
  effort: number;
  rest_time: number;
  comments: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RawExercise {
  id: string;
  name: string;
  video_ref: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RawProgression {
  id: string;
  selected_exercise_id: string | null;
  training_block_id: string | null;
  series: number;
  repetitions: string;
  effort: number;
  week_number: number;
  created_at: string;
  deleted_at: string | null;
}

export interface RawVolumeReduction {
  id: string;
  selected_exercise_id: string | null;
  training_block_id: string | null;
  fatigue_level: string;
  reduction_percentage: number;
  created_at: string;
  deleted_at: string | null;
}

export interface RawEffortReduction {
  id: string;
  selected_exercise_id: string | null;
  training_block_id: string | null;
  effort_level: string;
  reduction_amount: number;
  created_at: string;
  deleted_at: string | null;
}

// Type definitions for training plans
export type DayName = string;

export interface Progression {
  id: string;
  series: number;
  repetitions: string;
  effort: number;
}

export interface DisplayProgression {
  id: string;
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
}

export interface VolumeReduction {
  id: string;
  [fatigueLevel: string]: number | string;
}

export interface EffortReduction {
  id: string;
  [effortLevel: string]: number | string;
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
  sessions: Session[];
  nOfSessions: number;
  modelId?: string;
  athleteId?: string;
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
  updateWeeks: (weeks: number, isModel?: boolean) => Promise<void>;
  addSession: (
    session: Omit<Session, "id" | "planId">,
    isModel?: boolean,
    initialCreation?: boolean
  ) => Promise<PlanState | TrainingModel>;
  updateSession: (
    session: Session,
    isModel?: boolean,
    initialCreation?: boolean
  ) => Promise<PlanState | TrainingModel>;
  removeSession: (index: number, isModel?: boolean) => Promise<void>;
  addTrainingBlock: (
    sessionIndex: number,
    exerciseData: Exercise[],
    trainingBlock: Omit<TrainingBlock, "id" | "selectedExercises">,
    isModel?: boolean
  ) => Promise<PlanState | TrainingModel | void>;
  updateTrainingBlock: (
    block: TrainingBlock,
    isModel?: boolean
  ) => Promise<PlanState | TrainingModel>;
  removeExercise: (
    sessionIndex: number,
    exerciseId: string,
    blockId?: string,
    isModel?: boolean
  ) => Promise<void>;
  resetPlan: () => void;
  updateNOfSessions: (n: number, isModel?: boolean) => Promise<void>;
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
    isModel: boolean,
    blockId?: string
  ) => Promise<void>;
  model: TrainingModel;
  setModel: React.Dispatch<React.SetStateAction<TrainingModel>>;
  resetModelState: () => void;
  updateProgression: (
    sessionIndex: number,
    exerciseId: string,
    progressionIndex: number,
    progression: Progression,
    isModel?: boolean,
    blockId?: string
  ) => Promise<void>;
  saveNewTrainingPlan: (updatedPlan?: PlanState) => Promise<void>;
  saveNewTrainingModel: (updatedModel?: TrainingModel) => Promise<void>;
  isNewModel: boolean;
  isNewTrainingPlan: boolean;
  setIsNewModel: React.Dispatch<React.SetStateAction<boolean>>;
  setIsNewTrainingPlan: React.Dispatch<React.SetStateAction<boolean>>;
  updateModelName: (name: string) => Promise<void>;
  updateModelDescription: (description: string) => Promise<void>;
  deleteTrainingModel: (modelId: string) => Promise<void>;
  createTrainingPlanFromModel: (planState: PlanState) => Promise<void>;
  updateSelectedExercise: (
    sessionIndex: number,
    exerciseId: string,
    exercise: SelectedExercise,
    blockId?: string,
    isModel?: boolean
  ) => Promise<void>;
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
  reduceVolume: {
    id: "",
  },
  reduceEffort: {
    id: "",
  },
  selectedExercises: [],
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
    id: "",
    series: 3,
    repetitions: "6-8",
    effort: 80,
  },
  {
    id: "",
    series: 3,
    repetitions: "8-10",
    effort: 85,
  },
  {
    id: "",
    series: 3,
    repetitions: "10-12",
    effort: 90,
  },
  {
    id: "",
    series: 3,
    repetitions: "12-14",
    effort: 95,
  },
  {
    id: "",
    series: 3,
    repetitions: "14-16",
    effort: 100,
  },
  {
    id: "",
    series: 4,
    repetitions: "14-16",
    effort: 100,
  },
];
