import React, { createContext, useState, useContext, ReactNode } from "react";
import {
  Progression,
  VolumeReduction,
  EffortReduction,
  TrainingBlock,
  Session,
  PlanState,
  NewPlanContextType,
  SelectedExercise,
  defaultTrainingBlock,
  defaultPlanState,
} from "../types/trainingPlan";
import { v4 as uuidv4 } from "uuid";

// Create context
const NewPlanContext = createContext<NewPlanContextType | undefined>(undefined);

export const NewPlanProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [planState, setPlanState] = useState<PlanState>(defaultPlanState);

  // New state variables to hold the exercise block/exercise currently being edited
  const [currentExerciseBlock, setCurrentExerciseBlock] =
    useState<TrainingBlock | null>(null);
  const [currentSelectedExercise, setCurrentSelectedExercise] =
    useState<SelectedExercise | null>(null);

  // Save functions to push current block/exercise into the appropriate session
  const saveExerciseBlock = (sessionIndex: number) => {
    if (!currentExerciseBlock) return;
    setPlanState((prev) => {
      const updatedSessions = [...prev.sessions];
      if (!updatedSessions[sessionIndex]) return prev; // guard
      updatedSessions[sessionIndex].exercises = [
        ...updatedSessions[sessionIndex].exercises,
        currentExerciseBlock,
      ];
      setCurrentExerciseBlock(null);
      return { ...prev, sessions: updatedSessions };
    });
  };

  const saveSelectedExercise = (
    sessionIndex: number,
    currentSelectedExercise: SelectedExercise
  ) => {
    if (!currentSelectedExercise) return;
    const processedExercise = {
      ...currentSelectedExercise,
      id: uuidv4(),
    };

    setPlanState((prev) => {
      const updatedSessions = [...prev.sessions];
      if (!updatedSessions[sessionIndex]) return prev; // guard
      updatedSessions[sessionIndex].exercises = [
        ...updatedSessions[sessionIndex].exercises,
        processedExercise,
      ];
      setCurrentSelectedExercise(null);
      return { ...prev, sessions: updatedSessions };
    });
  };

  const updateWeeks = (weeks: number) => {
    setPlanState((prev) => ({ ...prev, nOfWeeks: weeks }));
  };

  const toggleUseAsModel = () => {
    setPlanState((prev) => ({ ...prev, modelId: "" }));
  };

  const updateModelId = (id: string) => {
    setPlanState((prev) => ({ ...prev, modelId: id }));
  };

  const updateNOfSessions = (n: number) => {
    setPlanState((prev) => ({ ...prev, nOfSessions: n }));
  };

  const addSession = (session: Session) => {
    setPlanState((prev) => ({
      ...prev,
      sessions: [...prev.sessions, session],
    }));
  };

  const updateSession = (index: number, session: Session) => {
    setPlanState((prev) => {
      const updatedSessions = [...prev.sessions];
      updatedSessions[index] = session;
      return { ...prev, sessions: updatedSessions };
    });
  };

  const removeSession = (index: number) => {
    setPlanState((prev) => {
      const updatedSessions = [...prev.sessions];
      updatedSessions.splice(index, 1);
      return { ...prev, sessions: updatedSessions };
    });
  };

  const addTrainingBlock = (sessionIndex: number) => {
    setPlanState((prev) => {
      const updatedSessions = [...prev.sessions];
      updatedSessions[sessionIndex].exercises = [
        ...updatedSessions[sessionIndex].exercises,
        { ...defaultTrainingBlock },
      ];
      return { ...prev, sessions: updatedSessions };
    });
  };

  const addExercise = (
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
  ) => {
    setPlanState((prev) => {
      const updatedSessions = [...prev.sessions];

      const newExercise: SelectedExercise = {
        type: "selectedExercise",
        name: name,
        id: uuidv4(),
        exerciseId: exerciseId,
        seriesN: series,
        reps: reps,
        effort: effort,
        reduceVolume:
          fatigueParameter === "volume"
            ? (handleFatigue as VolumeReduction) || {}
            : {},
        reduceEffort:
          fatigueParameter === "effort"
            ? (handleFatigue as EffortReduction) || {}
            : {},
        restTime: restTime,
        progression: progression,
      };

      updatedSessions[sessionIndex].exercises = [
        ...updatedSessions[sessionIndex].exercises,
        newExercise,
      ];

      return { ...prev, sessions: updatedSessions };
    });
    console.log(planState.sessions[sessionIndex].exercises);
  };

  const updateTrainingBlock = (
    sessionIndex: number,
    exerciseId: string,
    block: TrainingBlock
  ) => {
    setPlanState((prev) => {
      const updatedSessions = [...prev.sessions];
      updatedSessions[sessionIndex].exercises[exerciseId] = block;
      return { ...prev, sessions: updatedSessions };
    });
  };

  const removeExercise = (sessionIndex: number, exerciseId: string) => {
    setPlanState((prev) => {
      const updatedSessions = [...prev.sessions];
      updatedSessions[sessionIndex].exercises = updatedSessions[
        sessionIndex
      ].exercises.filter((exercise) => exercise.id !== exerciseId);
      return { ...prev, sessions: updatedSessions };
    });
  };

  const resetPlan = () => {
    setPlanState(defaultPlanState);
  };

  return (
    <NewPlanContext.Provider
      value={{
        planState,
        setPlanState,
        updateWeeks,
        toggleUseAsModel,
        updateModelId,
        addSession,
        updateSession,
        removeSession,
        addTrainingBlock,
        addExercise,
        updateTrainingBlock,
        removeExercise,
        resetPlan,
        updateNOfSessions,
        currentExerciseBlock,
        setCurrentExerciseBlock,
        currentSelectedExercise,
        setCurrentSelectedExercise,
        saveExerciseBlock,
        saveSelectedExercise,
      }}
    >
      {children}
    </NewPlanContext.Provider>
  );
};

export const useNewPlan = (): NewPlanContextType => {
  const context = useContext(NewPlanContext);
  if (context === undefined) {
    throw new Error("useNewPlan must be used within a NewPlanProvider");
  }
  return context;
};
