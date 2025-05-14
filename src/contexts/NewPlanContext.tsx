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
  Exercise,
} from "../types/trainingPlan";
import { v4 as uuidv4 } from "uuid";

// Create context
const NewPlanContext = createContext<NewPlanContextType | undefined>(undefined);

export const NewPlanProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [planState, setPlanState] = useState<PlanState>({
    ...defaultPlanState,
    id: uuidv4(),
  });

  // New state variables to hold the exercise block/exercise currently being edited
  const [currentExerciseBlock, setCurrentExerciseBlock] =
    useState<TrainingBlock | null>(null);
  const [currentSelectedExercise, setCurrentSelectedExercise] =
    useState<SelectedExercise | null>(null);

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

  const addSession = (session: Omit<Session, "id" | "planId">) => {
    const completeSession: Session = {
      ...session,
      id: uuidv4(),
      planId: planState.id,
    };
    setPlanState((prev) => ({
      ...prev,
      sessions: [...prev.sessions, completeSession],
    }));
  };

  const updateSession = (
    index: number,
    session: Omit<Session, "id" | "planId">
  ) => {
    const completeSession: Session = {
      ...session,
      id: planState.sessions[index].id,
      planId: planState.id,
    };
    setPlanState((prev) => {
      const updatedSessions = [...prev.sessions];
      updatedSessions[index] = completeSession;
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

  const addTrainingBlock = (
    sessionIndex: number,
    exerciseData: Exercise[],
    selectedExercise: SelectedExercise, //contains the default data for the block
    blockModel: "sequential" | "series"
  ) => {
    const processedSelectedExercises: SelectedExercise[] = exerciseData.map(
      (exercise) => ({
        id: uuidv4(),
        type: "selectedExercise",
        sessionId: planState.sessions[sessionIndex].id,
        name: exercise.name,
        exerciseId: exercise.id,
        seriesN: selectedExercise.seriesN,
        reps: selectedExercise.reps,
        effort: selectedExercise.effort,
        reduceVolume: selectedExercise.reduceVolume,
        reduceEffort: selectedExercise.reduceEffort,
        restTime: selectedExercise.restTime,
        progression: selectedExercise.progression,
        comments: "",
      })
    );
    const processedTrainingBlock: TrainingBlock = {
      id: uuidv4(),
      type: "trainingBlock",
      sessionId: planState.sessions[sessionIndex].id,
      name: selectedExercise.name,
      seriesN: selectedExercise.seriesN,
      reps: selectedExercise.reps,
      effort: selectedExercise.effort,
      reduceVolume: selectedExercise.reduceVolume,
      reduceEffort: selectedExercise.reduceEffort,
      selectedExercises: processedSelectedExercises,
      exercisesInSeries: [],
      blockModel: blockModel,
      progression: selectedExercise.progression,
      comments: "",
      restTime: selectedExercise.restTime,
    };
    setPlanState((prev) => {
      const updatedSessions = [...prev.sessions];
      updatedSessions[sessionIndex].exercises = [
        ...updatedSessions[sessionIndex].exercises,
        processedTrainingBlock,
      ];
      return { ...prev, sessions: updatedSessions };
    });
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

  const removeExercise = (
    //Also good for removing blocks
    sessionIndex: number,
    exerciseId: string,
    blockId?: string
  ) => {
    if (blockId) {
      setPlanState((prev) => {
        const updatedSessions = [...prev.sessions];
        const block = updatedSessions[sessionIndex].exercises.find(
          (e) => e.id === blockId
        ) as TrainingBlock;
        if (!block) return prev;
        block.selectedExercises = block.selectedExercises.filter(
          (e) => e.id !== exerciseId
        );
        if (block.selectedExercises.length > 0) {
          updatedSessions[sessionIndex].exercises = updatedSessions[
            sessionIndex
          ].exercises.map((e) => (e.id === blockId ? block : e));
        } else {
          updatedSessions[sessionIndex].exercises = updatedSessions[
            sessionIndex
          ].exercises.filter((e) => e.id !== blockId);
        }

        return { ...prev, sessions: updatedSessions };
      });
    }
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
        updateTrainingBlock,
        removeExercise,
        resetPlan,
        updateNOfSessions,
        currentExerciseBlock,
        setCurrentExerciseBlock,
        currentSelectedExercise,
        setCurrentSelectedExercise,
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
