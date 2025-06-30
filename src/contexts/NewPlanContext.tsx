import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
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
  TrainingModel,
} from "../types/trainingPlan";
import { v4 as uuidv4 } from "uuid";
import {
  addTrainingPlan,
  addTrainingModel,
  addSelectedExercise,
  updateTrainingPlan,
  updateTrainingModel,
  addSession as parserAddSession,
  updateSession as parserUpdateSession,
  deleteSession as parserDeleteSession,
  addTrainingBlock as parserAddTrainingBlock,
  updateTrainingBlock as parserUpdateTrainingBlock,
  deleteTrainingBlock as parserDeleteTrainingBlock,
  deleteSelectedExercise as parserDeleteSelectedExercise,
  updateProgression as parserUpdateProgression,
  deleteTrainingModel as parserDeleteTrainingModel,
  updateSelectedExercise as parserUpdateSelectedExercise,
} from "../parsers/trainingDataParser";
import { useUser } from "./UserContext";
import { useDatabaseSync } from "../hooks/useDatabaseSync";
import Database from "@tauri-apps/plugin-sql";
import { useTrainingModels } from "./TrainingModelsContext";
import { useStudyContext } from "./StudyContext";
import { useAthletes } from "./AthletesContext";

// Create context
const NewPlanContext = createContext<NewPlanContextType | undefined>(undefined);

export const NewPlanProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useUser();
  const { fullScaleSync, syncPendingRecords, pushRecord } = useDatabaseSync();
  const { trainingModels, setTrainingModels } = useTrainingModels();
  const [planState, setPlanState] = useState<PlanState>({
    ...defaultPlanState,
    id: uuidv4(),
  });

  const [model, setModel] = useState<TrainingModel>({
    ...planState,
    name: "",
    description: "",
    id: uuidv4(),
    trainingPlanId: uuidv4(),
  });

  const [isNewModel, setIsNewModel] = useState<boolean>(true);
  const [isNewTrainingPlan, setIsNewTrainingPlan] = useState<boolean>(true);

  const [currentExerciseBlock, setCurrentExerciseBlock] =
    useState<TrainingBlock | null>(null);
  const [currentSelectedExercise, setCurrentSelectedExercise] =
    useState<SelectedExercise | null>(null);

  const { athlete, setAthlete } = useStudyContext();
  const { syncSpecificAthlete } = useAthletes();
  const saveSelectedExercise = async (
    sessionIndex: number,
    currentSelectedExercise: SelectedExercise,
    isModel: boolean = false
  ) => {
    if (!currentSelectedExercise) return;
    const currentPlan = isModel ? model : planState;
    const setCurrentPlan = isModel ? setModel : setPlanState;
    const result = await addSelectedExercise(
      currentSelectedExercise,
      currentPlan.sessions[sessionIndex].id,
      null,
      pushRecord,
      undefined
    );
    if (Array.isArray(result)) {
      return;
    }
    const id = result;
    const processedExercise = {
      ...currentSelectedExercise,
      id,
      sessionId: currentPlan.sessions[sessionIndex].id,
    };
    const updatedSessions = [...currentPlan.sessions];
    if (!updatedSessions[sessionIndex]) return; // guard
    updatedSessions[sessionIndex].exercises = [
      ...updatedSessions[sessionIndex].exercises,
      processedExercise,
    ];
    setCurrentSelectedExercise(null);
    const updatedCurrentPlan = { ...currentPlan, sessions: updatedSessions };
    setCurrentPlan(updatedCurrentPlan);
  };

  const updateWeeks = async (weeks: number, isModel: boolean = false) => {
    let relevantPlanState;
    if (isModel) {
      relevantPlanState = {
        ...Object.fromEntries(
          Object.entries(model).filter(
            ([key]) => !["trainingPlanId", "name", "description"].includes(key)
          )
        ),
        id: model.trainingPlanId,
        nOfWeeks: weeks,
      };
    } else {
      relevantPlanState = {
        ...planState,
        nOfWeeks: weeks,
      };
    }
    await updateTrainingPlan(relevantPlanState, pushRecord);
    if (isModel) {
      setModel({ ...model, nOfWeeks: weeks });
    } else {
      setPlanState({ ...planState, nOfWeeks: weeks });
    }
  };

  const updateNOfSessions = async (n: number, isModel: boolean = false) => {
    let relevantPlanState;
    if (isModel) {
      relevantPlanState = {
        ...Object.fromEntries(
          Object.entries(model).filter(
            ([key]) => !["trainingPlanId", "name", "description"].includes(key)
          )
        ),
        id: model.trainingPlanId,
        nOfSessions: n,
      };
    } else {
      relevantPlanState = {
        ...planState,
        nOfSessions: n,
      };
    }
    await updateTrainingPlan(relevantPlanState, pushRecord);
    if (isModel) {
      setModel({ ...model, nOfSessions: n });
    } else {
      setPlanState({ ...planState, nOfSessions: n });
    }
  };

  const updateModelName = async (name: string) => {
    const updatedModel = {
      ...model,
      name,
    };
    await updateTrainingModel(updatedModel, pushRecord);
    setModel(updatedModel);
  };

  const updateModelDescription = async (description: string) => {
    const updatedModel = {
      ...model,
      description,
    };
    await updateTrainingModel(updatedModel, pushRecord);
    setModel(updatedModel);
  };

  const addSession = async (
    session: Omit<Session, "id" | "planId">,
    isModel: boolean = false
  ): Promise<PlanState | TrainingModel> => {
    const currentPlan = isModel ? model : planState;
    const setCurrentPlan = isModel ? setModel : setPlanState;
    const completeSession: Session = {
      ...session,
      id: uuidv4(),
      planId: isModel ? model.trainingPlanId : planState.id,
    };
    if ((isModel && !isNewModel) || (!isModel && !isNewTrainingPlan)) {
      await parserAddSession(
        completeSession,
        isModel ? model.trainingPlanId : planState.id,
        pushRecord,
        undefined
      );
    }

    const updatedPlan = {
      ...currentPlan,
      sessions: [...currentPlan.sessions, completeSession],
    };

    setCurrentPlan(updatedPlan);

    return updatedPlan;
  };

  const updateSession = async (
    session: Session,
    isModel: boolean = false
  ): Promise<PlanState | TrainingModel> => {
    const currentPlan = isModel ? model : planState;
    const setCurrentPlan = isModel ? setModel : setPlanState;

    const updatedSessions = currentPlan.sessions.map((s) =>
      s.id === session.id ? session : s
    );
    const updatedPlan = { ...currentPlan, sessions: updatedSessions };
    if ((isModel && !isNewModel) || (!isModel && !isNewTrainingPlan)) {
      await parserUpdateSession(session, pushRecord);
    }
    setCurrentPlan(updatedPlan);
    return updatedPlan;
  };

  const removeSession = async (index: number, isModel: boolean = false) => {
    const currentPlan = isModel ? model : planState;
    const setCurrentPlan = isModel ? setModel : setPlanState;
    const sessionToDelete = currentPlan.sessions[index];

    const updatedSessions = currentPlan.sessions.filter(
      (s) => s.id !== sessionToDelete.id
    );
    const updatedPlan = { ...currentPlan, sessions: updatedSessions };

    await parserDeleteSession(sessionToDelete.id, pushRecord);
    setCurrentPlan(updatedPlan);
  };

  const addTrainingBlock = async (
    sessionIndex: number,
    exerciseData: Exercise[],
    trainingBlock: Omit<TrainingBlock, "id" | "selectedExercises">,
    isModel: boolean = false
  ) => {
    const currentPlan = isModel ? model : planState;
    const setCurrentPlan = isModel ? setModel : setPlanState;

    const processedSelectedExercises: SelectedExercise[] = exerciseData.map(
      (exercise) => ({
        id: uuidv4(),
        type: "selectedExercise",
        sessionId: currentPlan.sessions[sessionIndex].id,
        name: exercise.name,
        exerciseId: exercise.id,
        series: trainingBlock.series,
        repetitions: trainingBlock.repetitions,
        effort: trainingBlock.effort,
        reduceVolume: trainingBlock.reduceVolume,
        reduceEffort: trainingBlock.reduceEffort,
        restTime: trainingBlock.restTime,
        progression: trainingBlock.progression,
        comments: "",
      })
    );

    const processedTrainingBlock: TrainingBlock = {
      ...trainingBlock,
      id: uuidv4(),
      type: "trainingBlock",
      sessionId: currentPlan.sessions[sessionIndex].id,
      selectedExercises: processedSelectedExercises,
    };

    const updatedSessions = [...currentPlan.sessions];
    updatedSessions[sessionIndex].exercises = [
      ...updatedSessions[sessionIndex].exercises,
      processedTrainingBlock,
    ];
    const updatedPlan = { ...currentPlan, sessions: updatedSessions };

    await parserAddTrainingBlock(
      processedTrainingBlock,
      currentPlan.sessions[sessionIndex].id,
      pushRecord,
      undefined
    );
    setCurrentPlan(updatedPlan);
    return updatedPlan;
  };

  const updateTrainingBlock = async (
    sessionIndex: number,
    exerciseId: string,
    block: TrainingBlock,
    isModel: boolean = false
  ) => {
    const currentPlan = isModel ? model : planState;
    const setCurrentPlan = isModel ? setModel : setPlanState;

    await parserUpdateTrainingBlock(block, pushRecord);

    const updatedSessions = [...currentPlan.sessions];
    updatedSessions[sessionIndex].exercises[exerciseId] = block;
    setCurrentPlan({ ...currentPlan, sessions: updatedSessions });
  };

  const removeExercise = async (
    //Also good for removing blocks
    sessionIndex: number,
    exerciseId: string,
    blockId?: string,
    isModel: boolean = false
  ) => {
    const currentPlan = isModel ? model : planState;
    const setCurrentPlan = isModel ? setModel : setPlanState;

    if (blockId) {
      await parserDeleteTrainingBlock(blockId, pushRecord);
      const updatedSessions = [...currentPlan.sessions];
      updatedSessions[sessionIndex].exercises = updatedSessions[
        sessionIndex
      ].exercises.filter((exercise) => exercise.id !== exerciseId);
      const updatedPlan = { ...currentPlan, sessions: updatedSessions };
      setCurrentPlan(updatedPlan);
    } else {
      await parserDeleteSelectedExercise(exerciseId, pushRecord);
      const updatedSessions = [...currentPlan.sessions];
      updatedSessions[sessionIndex].exercises = updatedSessions[
        sessionIndex
      ].exercises.filter((exercise) => exercise.id !== exerciseId);
      const updatedPlan = { ...currentPlan, sessions: updatedSessions };
      setCurrentPlan(updatedPlan);
    }
  };

  const resetPlan = () => {
    setPlanState({ ...defaultPlanState, id: uuidv4() });
    setIsNewTrainingPlan(true);
  };

  const resetModelState = () => {
    setModel({
      ...defaultPlanState,
      id: uuidv4(),
      trainingPlanId: uuidv4(),
      name: "",
      description: "",
    });
    setIsNewModel(true);
  };

  const updateProgression = async (
    sessionIndex: number,
    exerciseId: string,
    progressionIndex: number,
    progression: Progression,
    isModel: boolean = false
  ) => {
    const currentPlan = isModel ? model : planState;
    const setCurrentPlan = isModel ? setModel : setPlanState;

    await parserUpdateProgression(progression, pushRecord);
    const updatedSessions = [...currentPlan.sessions];
    const exercise = updatedSessions[sessionIndex].exercises.find(
      (exercise) => exercise.id === exerciseId
    );
    if (!exercise) return;
    exercise.progression[progressionIndex] = progression;

    setCurrentPlan({ ...currentPlan, sessions: updatedSessions });
  };

  // Manual save functions - call these explicitly when user wants to create/save
  const saveNewTrainingPlan = async (updatedPlan?: PlanState) => {
    const planToSave = updatedPlan || planState;
    planToSave.athleteId = athlete?.id;
    await addTrainingPlan(planToSave, user.id, pushRecord);
    setPlanState(planToSave);
    setIsNewTrainingPlan(false);
  };

  const saveNewTrainingModel = async (updatedModel?: TrainingModel) => {
    const modelToSave = updatedModel || model;
    await addTrainingModel(modelToSave, user.id, pushRecord);
    setTrainingModels([...trainingModels, modelToSave]);
    setModel(modelToSave);
    setIsNewModel(false);
  };
  const resetIds = (plan: PlanState) => {
    return {
      ...plan,
      id: uuidv4(),
      sessions: plan.sessions.map((session) => ({
        ...session,
        id: uuidv4(),
        exercises: session.exercises.map((exercise) => ({
          ...exercise,
          id: uuidv4(),
          progression: exercise.progression.map((progression) => ({
            ...progression,
            id: uuidv4(),
          })),
          reduceVolume: exercise.reduceVolume,
          reduceEffort: exercise.reduceEffort,
          ...(exercise.type === "trainingBlock" && {
            selectedExercises: exercise.selectedExercises.map(
              (selectedExercise) => ({
                ...selectedExercise,
                id: uuidv4(),
                progression: selectedExercise.progression.map(
                  (progression) => ({
                    ...progression,
                    id: uuidv4(),
                  })
                ),
                reduceVolume: selectedExercise.reduceVolume,
                reduceEffort: selectedExercise.reduceEffort,
              })
            ),
          }),
        })),
      })),
    };
  };

  const createTrainingPlanFromModel = async (planState: PlanState) => {
    const currentAthlete = { ...athlete };
    const planToSave = resetIds(planState);
    planToSave.athleteId = currentAthlete?.id;
    console.log("saving plan", planToSave);
    await addTrainingPlan(planToSave, user.id, pushRecord);
    const newAthlete = { ...currentAthlete, currentTrainingPlan: planToSave };
    syncSpecificAthlete(newAthlete);
    setAthlete(newAthlete);
    setPlanState(planToSave);
  };

  const deleteTrainingModel = async (modelId: string) => {
    await parserDeleteTrainingModel(modelId, pushRecord);
    setTrainingModels(trainingModels.filter((model) => model.id !== modelId));
    resetModelState();
  };

  const updateSelectedExercise = async (
    sessionIndex: number,
    exerciseId: string,
    exercise: SelectedExercise,
    blockId?: string,
    isModel: boolean = false
  ) => {
    const currentPlan = isModel ? model : planState;
    const setCurrentPlan = isModel ? setModel : setPlanState;

    await parserUpdateSelectedExercise(exercise, pushRecord);
    const updatedSessions = [...currentPlan.sessions];
    if (blockId) {
      const block = updatedSessions[sessionIndex].exercises.find(
        (e) => e.id === blockId
      ) as TrainingBlock;
      const selectedExercise = block.selectedExercises.find(
        (e) => e.id === exerciseId
      );
      if (!selectedExercise) return;
      selectedExercise.restTime = exercise.restTime;
    } else {
      const selectedExercise = updatedSessions[sessionIndex].exercises.find(
        (e) => e.id === exerciseId
      ) as SelectedExercise;
      if (!selectedExercise) return;
      selectedExercise.restTime = exercise.restTime;
    }
    setCurrentPlan({ ...currentPlan, sessions: updatedSessions });
  };

  return (
    <NewPlanContext.Provider
      value={{
        planState,
        setPlanState,
        updateWeeks,
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
        model,
        saveSelectedExercise,
        setModel,
        resetModelState,
        updateProgression,
        saveNewTrainingPlan,
        createTrainingPlanFromModel,
        saveNewTrainingModel,
        isNewModel,
        isNewTrainingPlan,
        setIsNewModel,
        setIsNewTrainingPlan,
        updateModelName,
        updateModelDescription,
        deleteTrainingModel,
        updateSelectedExercise,
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
