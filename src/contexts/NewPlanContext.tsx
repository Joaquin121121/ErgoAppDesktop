import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import {
  DayName,
  Progression,
  VolumeReduction,
  EffortReduction,
  TrainingBlock,
  Session,
  PlanState,
  NewPlanContextType,
  defaultTrainingBlock,
  defaultSession,
  defaultPlanState,
} from "../types/trainingPlan";

// Create context
const NewPlanContext = createContext<NewPlanContextType | undefined>(undefined);

export const NewPlanProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [planState, setPlanState] = useState<PlanState>(defaultPlanState);

  const updateWeeks = (weeks: number) => {
    setPlanState((prev) => ({ ...prev, nOfWeeks: weeks }));
  };

  const toggleUseAsModel = () => {
    setPlanState((prev) => ({ ...prev, useAsModel: !prev.useAsModel }));
  };

  const updateModelId = (id: string) => {
    setPlanState((prev) => ({ ...prev, modelId: id }));
  };

  const updateModelName = (name: string) => {
    setPlanState((prev) => ({ ...prev, modelName: name }));
  };

  const addSession = () => {
    setPlanState((prev) => ({
      ...prev,
      sessions: [...prev.sessions, { ...defaultSession }],
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
      updatedSessions[sessionIndex].trainingBlocks = [
        ...updatedSessions[sessionIndex].trainingBlocks,
        { ...defaultTrainingBlock },
      ];
      return { ...prev, sessions: updatedSessions };
    });
  };

  const updateTrainingBlock = (
    sessionIndex: number,
    blockIndex: number,
    block: TrainingBlock
  ) => {
    setPlanState((prev) => {
      const updatedSessions = [...prev.sessions];
      updatedSessions[sessionIndex].trainingBlocks[blockIndex] = block;
      return { ...prev, sessions: updatedSessions };
    });
  };

  const removeTrainingBlock = (sessionIndex: number, blockIndex: number) => {
    setPlanState((prev) => {
      const updatedSessions = [...prev.sessions];
      updatedSessions[sessionIndex].trainingBlocks.splice(blockIndex, 1);
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
        updateModelName,
        addSession,
        updateSession,
        removeSession,
        addTrainingBlock,
        updateTrainingBlock,
        removeTrainingBlock,
        resetPlan,
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
