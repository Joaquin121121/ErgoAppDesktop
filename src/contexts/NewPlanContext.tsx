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
  saveTrainingPlan,
  saveTrainingModel,
  updateTrainingPlan,
  updateTrainingModel,
  updateTrainingPlanMetadata,
  updateTrainingModelMetadata,
  updateSession,
  updateSelectedExercise,
  updateTrainingBlock,
} from "../hooks/parseTrainingData";
import { useUser } from "./UserContext";
import { useRecordSync, SyncPriority } from "../hooks/useRecordSync";
import { useDatabaseSync } from "../hooks/useDatabaseSync";
import Database from "@tauri-apps/plugin-sql";

// Create context
const NewPlanContext = createContext<NewPlanContextType | undefined>(undefined);

export const NewPlanProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useUser();
  const {
    queueCriticalChange,
    queueHighChange,
    queueMediumChange,
    queueLowChange,
    syncStats,
    isProcessing,
    forceSyncAll,
  } = useRecordSync();
  const { syncSpecificTable } = useDatabaseSync();

  const [planState, setPlanState] = useState<PlanState>({
    ...defaultPlanState,
    id: uuidv4(),
  });

  const [model, setModel] = useState<TrainingModel>({
    ...planState,
    name: "",
    description: "",
  });

  // New boolean flags to track if model/plan are new (not yet saved to DB)
  const [isNewModel, setIsNewModel] = useState<boolean>(true);
  const [isNewTrainingPlan, setIsNewTrainingPlan] = useState<boolean>(true);

  useEffect(() => {
    console.log("Model: ", model);
  }, [model]);

  // New state variables to hold the exercise block/exercise currently being edited
  const [currentExerciseBlock, setCurrentExerciseBlock] =
    useState<TrainingBlock | null>(null);
  const [currentSelectedExercise, setCurrentSelectedExercise] =
    useState<SelectedExercise | null>(null);

  // Helper function to get progression UUID from database
  const getProgressionId = async (
    selectedExerciseId: string | null,
    trainingBlockId: string | null,
    weekNumber: number
  ): Promise<string | null> => {
    try {
      const db = await Database.load("sqlite:ergolab.db");

      let query: string;
      let params: any[];

      if (selectedExerciseId) {
        query =
          "SELECT id FROM progressions WHERE selected_exercise_id = ? AND week_number = ? AND deleted_at IS NULL";
        params = [selectedExerciseId, weekNumber];
      } else if (trainingBlockId) {
        query =
          "SELECT id FROM progressions WHERE training_block_id = ? AND week_number = ? AND deleted_at IS NULL";
        params = [trainingBlockId, weekNumber];
      } else {
        return null;
      }

      const result = await db.select(query, params);

      if (Array.isArray(result) && result.length > 0) {
        return result[0].id;
      }

      return null;
    } catch (error) {
      console.error("Error getting progression ID:", error);
      return null;
    }
  };

  // Helper function to map frontend property names to database column names
  const mapPropertyToDbColumn = (property: string): string => {
    const mapping: Record<string, string> = {
      restTime: "rest_time",
      sessionId: "session_id",
      exerciseId: "exercise_id",
      blockId: "block_id",
      // Add more mappings as needed
    };
    return mapping[property] || property;
  };

  const saveSelectedExercise = async (
    sessionIndex: number,
    currentSelectedExercise: SelectedExercise,
    isModel: boolean = false
  ) => {
    if (!currentSelectedExercise) return;
    const currentPlan = isModel ? model : planState;
    const processedExercise = {
      ...currentSelectedExercise,
      id: uuidv4(),
      sessionId: currentPlan.sessions[sessionIndex].id,
      last_changed: new Date().toISOString(),
    };

    if (isModel) {
      setModel((prev) => {
        const updatedSessions = [...prev.sessions];
        if (!updatedSessions[sessionIndex]) return prev; // guard
        updatedSessions[sessionIndex].exercises = [
          ...updatedSessions[sessionIndex].exercises,
          processedExercise,
        ];
        setCurrentSelectedExercise(null);
        const updatedModel = { ...prev, sessions: updatedSessions };

        // Only update database if model is not new
        if (!isNewModel) {
          // Update database and queue for sync
          updateSession(updatedSessions[sessionIndex])
            .then(() => {
              // Queue the selected exercise for sync
              queueHighChange(
                "selected_exercises",
                processedExercise.id,
                "insert",
                processedExercise
              );
            })
            .catch(console.error);
        }

        return updatedModel;
      });
    } else {
      setPlanState((prev) => {
        const updatedSessions = [...prev.sessions];
        if (!updatedSessions[sessionIndex]) return prev; // guard
        updatedSessions[sessionIndex].exercises = [
          ...updatedSessions[sessionIndex].exercises,
          processedExercise,
        ];
        setCurrentSelectedExercise(null);
        const updatedPlan = { ...prev, sessions: updatedSessions };

        // Only update database if plan is not new
        if (!isNewTrainingPlan) {
          // Update database and queue for sync
          updateSession(updatedSessions[sessionIndex])
            .then(() => {
              // Queue the selected exercise for sync
              queueHighChange(
                "selected_exercises",
                processedExercise.id,
                "insert",
                processedExercise
              );
            })
            .catch(console.error);
        }

        return updatedPlan;
      });
    }
  };

  const updateWeeks = async (weeks: number, isModel: boolean = false) => {
    if (isModel) {
      setModel((prev) => {
        const updatedModel = {
          ...prev,
          nOfWeeks: weeks,
          last_changed: new Date().toISOString(),
        };

        // Only update database if model is not new
        if (!isNewModel) {
          // Update database and queue for sync
          updateTrainingModelMetadata(prev.id, {}).catch(console.error);
          updateTrainingPlanMetadata(prev.id, { nOfWeeks: weeks })
            .then(() => {
              // Queue metadata change - low priority as it's not critical
              queueLowChange("training_plans", prev.id, "update", {
                id: prev.id,
                n_of_weeks: weeks,
                last_changed: updatedModel.last_changed,
              });
            })
            .catch(console.error);
        }

        return updatedModel;
      });
    } else {
      setPlanState((prev) => {
        const updatedPlan = {
          ...prev,
          nOfWeeks: weeks,
          last_changed: new Date().toISOString(),
        };

        // Only update database if plan is not new
        if (!isNewTrainingPlan) {
          // Update database and queue for sync
          updateTrainingPlanMetadata(prev.id, { nOfWeeks: weeks })
            .then(() => {
              // Queue metadata change - low priority as it's not critical
              queueLowChange("training_plans", prev.id, "update", {
                id: prev.id,
                n_of_weeks: weeks,
                last_changed: updatedPlan.last_changed,
              });
            })
            .catch(console.error);
        }

        return updatedPlan;
      });
    }
  };

  const linkTrainingPlanToModel = async (planId: string, modelId: string) => {
    try {
      const db = await Database.load("sqlite:ergolab.db");

      // Insert into training_plan_models relationship table
      await db.execute(
        "INSERT INTO training_plan_models (training_plan_id, model_id, created_at, last_changed) VALUES (?, ?, ?, ?)",
        [planId, modelId, new Date().toISOString(), new Date().toISOString()]
      );

      // Queue relationship creation - medium priority
      queueMediumChange(
        "training_plan_models",
        `${planId}_${modelId}`,
        "insert",
        {
          training_plan_id: planId,
          model_id: modelId,
          created_at: new Date().toISOString(),
          last_changed: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error("Error linking training plan to model:", error);
      throw error;
    }
  };

  const unlinkTrainingPlanFromModel = async (
    planId: string,
    modelId: string
  ) => {
    try {
      const db = await Database.load("sqlite:ergolab.db");

      // Soft delete from training_plan_models relationship table
      await db.execute(
        "UPDATE training_plan_models SET deleted_at = ?, last_changed = ? WHERE training_plan_id = ? AND model_id = ?",
        [new Date().toISOString(), new Date().toISOString(), planId, modelId]
      );

      // Queue relationship deletion - medium priority
      queueMediumChange(
        "training_plan_models",
        `${planId}_${modelId}`,
        "delete"
      );
    } catch (error) {
      console.error("Error unlinking training plan from model:", error);
      throw error;
    }
  };

  const updateNOfSessions = async (n: number, isModel: boolean = false) => {
    if (isModel) {
      setModel((prev) => {
        const updatedModel = {
          ...prev,
          nOfSessions: n,
          last_changed: new Date().toISOString(),
        };

        // Only update database if model is not new
        if (!isNewModel) {
          // Update database and queue for sync
          updateTrainingPlanMetadata(prev.id, { nOfSessions: n })
            .then(() => {
              // Queue metadata change - low priority
              queueLowChange("training_plans", prev.id, "update", {
                id: prev.id,
                n_of_sessions: n,
                last_changed: updatedModel.last_changed,
              });
            })
            .catch(console.error);
        }

        return updatedModel;
      });
    } else {
      setPlanState((prev) => {
        const updatedPlan = {
          ...prev,
          nOfSessions: n,
          last_changed: new Date().toISOString(),
        };

        // Only update database if plan is not new
        if (!isNewTrainingPlan) {
          // Update database and queue for sync
          updateTrainingPlanMetadata(prev.id, { nOfSessions: n })
            .then(() => {
              // Queue metadata change - low priority
              queueLowChange("training_plans", prev.id, "update", {
                id: prev.id,
                n_of_sessions: n,
                last_changed: updatedPlan.last_changed,
              });
            })
            .catch(console.error);
        }

        return updatedPlan;
      });
    }
  };

  const updateModelName = async (name: string) => {
    setModel((prev) => {
      const updatedModel = {
        ...prev,
        name,
        last_changed: new Date().toISOString(),
      };

      // Only update database if model is not new
      if (!isNewModel) {
        // Update database and queue for sync
        updateTrainingModelMetadata(prev.id, { name })
          .then(() => {
            // Queue metadata change - medium priority
            queueMediumChange("training_models", prev.id, "update", {
              id: prev.id,
              name,
              last_changed: updatedModel.last_changed,
            });
          })
          .catch(console.error);
      }

      return updatedModel;
    });
  };

  const updateModelDescription = async (description: string) => {
    setModel((prev) => {
      const updatedModel = {
        ...prev,
        description,
        last_changed: new Date().toISOString(),
      };

      // Only update database if model is not new
      if (!isNewModel) {
        // Update database and queue for sync
        updateTrainingModelMetadata(prev.id, { description })
          .then(() => {
            // Queue metadata change - low priority
            queueLowChange("training_models", prev.id, "update", {
              id: prev.id,
              description,
              last_changed: updatedModel.last_changed,
            });
          })
          .catch(console.error);
      }

      return updatedModel;
    });
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
      planId: currentPlan.id,
      last_changed: new Date().toISOString(),
    };

    const updatedPlan = {
      ...currentPlan,
      sessions: [...currentPlan.sessions, completeSession],
    };

    setCurrentPlan(() => {
      // Only update database if model/plan is not new
      if (isModel && !isNewModel) {
        updateTrainingModel(updatedPlan as TrainingModel, user.id)
          .then(() => {
            // Queue session creation - high priority as it's user content
            queueHighChange("sessions", completeSession.id, "insert", {
              id: completeSession.id,
              plan_id: completeSession.planId,
              name: completeSession.name,
              last_changed: completeSession.last_changed,
            });
          })
          .catch(console.error);
      } else if (!isModel && !isNewTrainingPlan) {
        updateTrainingPlan(updatedPlan, user.id)
          .then(() => {
            // Queue session creation - high priority as it's user content
            queueHighChange("sessions", completeSession.id, "insert", {
              id: completeSession.id,
              plan_id: completeSession.planId,
              name: completeSession.name,
              last_changed: completeSession.last_changed,
            });
          })
          .catch(console.error);
      }

      return updatedPlan;
    });

    return updatedPlan;
  };

  const updateSessionFunc = async (
    index: number,
    session: Omit<Session, "id" | "planId">,
    isModel: boolean = false
  ): Promise<PlanState | TrainingModel> => {
    const currentPlan = isModel ? model : planState;
    const setCurrentPlan = isModel ? setModel : setPlanState;

    const completeSession: Session = {
      ...session,
      id: currentPlan.sessions[index].id,
      planId: currentPlan.id,
      last_changed: new Date().toISOString(),
    };

    const updatedSessions = [...currentPlan.sessions];
    updatedSessions[index] = completeSession;
    const updatedPlan = { ...currentPlan, sessions: updatedSessions };

    setCurrentPlan(() => {
      // Only update database if model/plan is not new
      if ((isModel && !isNewModel) || (!isModel && !isNewTrainingPlan)) {
        // Update database and queue for sync
        updateSession(completeSession)
          .then(() => {
            // Queue session update - high priority as it's user content
            queueHighChange("sessions", completeSession.id, "update", {
              id: completeSession.id,
              plan_id: completeSession.planId,
              name: completeSession.name,
              last_changed: completeSession.last_changed,
            });
          })
          .catch(console.error);
      }

      return updatedPlan;
    });

    return updatedPlan;
  };

  const removeSession = async (index: number, isModel: boolean = false) => {
    const currentPlan = isModel ? model : planState;
    const setCurrentPlan = isModel ? setModel : setPlanState;
    const sessionToDelete = currentPlan.sessions[index];

    setCurrentPlan((prev) => {
      const updatedSessions = [...prev.sessions];
      updatedSessions.splice(index, 1);
      const updatedPlan = { ...prev, sessions: updatedSessions };

      // Only update database if model/plan is not new
      if (isModel && !isNewModel) {
        updateTrainingModel(updatedPlan as TrainingModel, user.id)
          .then(() => {
            // Queue session deletion - critical priority as it's destructive
            queueCriticalChange("sessions", sessionToDelete.id, "delete");
          })
          .catch(console.error);
      } else if (!isModel && !isNewTrainingPlan) {
        updateTrainingPlan(updatedPlan, user.id)
          .then(() => {
            // Queue session deletion - critical priority as it's destructive
            queueCriticalChange("sessions", sessionToDelete.id, "delete");
          })
          .catch(console.error);
      }

      return updatedPlan;
    });
  };

  const addTrainingBlock = async (
    sessionIndex: number,
    exerciseData: Exercise[],
    selectedExercise: SelectedExercise, //contains the default data for the block
    blockModel: "sequential" | "series",
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
        series: selectedExercise.series,
        repetitions: selectedExercise.repetitions,
        effort: selectedExercise.effort,
        reduceVolume: selectedExercise.reduceVolume,
        reduceEffort: selectedExercise.reduceEffort,
        restTime: selectedExercise.restTime,
        progression: selectedExercise.progression,
        comments: "",
        last_changed: new Date().toISOString(),
      })
    );

    const processedTrainingBlock: TrainingBlock = {
      id: uuidv4(),
      type: "trainingBlock",
      sessionId: currentPlan.sessions[sessionIndex].id,
      name: selectedExercise.name,
      series: selectedExercise.series,
      repetitions: selectedExercise.repetitions,
      effort: selectedExercise.effort,
      reduceVolume: selectedExercise.reduceVolume,
      reduceEffort: selectedExercise.reduceEffort,
      selectedExercises: processedSelectedExercises,
      exercisesInSeries: [],
      blockModel: blockModel,
      progression: selectedExercise.progression,
      comments: "",
      restTime: selectedExercise.restTime,
      last_changed: new Date().toISOString(),
    };

    setCurrentPlan((prev) => {
      const updatedSessions = [...prev.sessions];
      updatedSessions[sessionIndex].exercises = [
        ...updatedSessions[sessionIndex].exercises,
        processedTrainingBlock,
      ];
      const updatedPlan = { ...prev, sessions: updatedSessions };

      // Only update database if model/plan is not new
      if ((isModel && !isNewModel) || (!isModel && !isNewTrainingPlan)) {
        // Update database and queue for sync
        updateSession(updatedSessions[sessionIndex])
          .then(() => {
            // Queue training block creation - high priority
            queueHighChange(
              "training_blocks",
              processedTrainingBlock.id,
              "insert",
              {
                id: processedTrainingBlock.id,
                session_id: processedTrainingBlock.sessionId,
                name: processedTrainingBlock.name,
                series: processedTrainingBlock.series,
                repetitions: processedTrainingBlock.repetitions,
                effort: processedTrainingBlock.effort,
                block_model: processedTrainingBlock.blockModel,
                comments: processedTrainingBlock.comments,
                rest_time: processedTrainingBlock.restTime,
                last_changed: processedTrainingBlock.last_changed,
              }
            );

            // Queue selected exercises within the block
            processedSelectedExercises.forEach((exercise) => {
              queueHighChange("selected_exercises", exercise.id, "insert", {
                id: exercise.id,
                session_id: exercise.sessionId,
                exercise_id: exercise.exerciseId,
                block_id: processedTrainingBlock.id,
                series: exercise.series,
                repetitions: exercise.repetitions,
                effort: exercise.effort,
                rest_time: exercise.restTime,
                comments: exercise.comments,
                last_changed: exercise.last_changed,
              });
            });
          })
          .catch(console.error);
      }

      return updatedPlan;
    });
  };

  const updateTrainingBlockFunc = async (
    sessionIndex: number,
    exerciseId: string,
    block: TrainingBlock,
    isModel: boolean = false
  ) => {
    const setCurrentPlan = isModel ? setModel : setPlanState;

    setCurrentPlan((prev) => {
      const updatedSessions = [...prev.sessions];
      updatedSessions[sessionIndex].exercises[exerciseId] = {
        ...block,
        last_changed: new Date().toISOString(),
      };
      const updatedPlan = { ...prev, sessions: updatedSessions };

      // Only update database if model/plan is not new
      if ((isModel && !isNewModel) || (!isModel && !isNewTrainingPlan)) {
        // Update database and queue for sync
        updateTrainingBlock({
          ...block,
          last_changed: new Date().toISOString(),
        })
          .then(() => {
            // Queue training block update - high priority
            queueHighChange("training_blocks", block.id, "update", {
              id: block.id,
              session_id: block.sessionId,
              name: block.name,
              series: block.series,
              repetitions: block.repetitions,
              effort: block.effort,
              block_model: block.blockModel,
              comments: block.comments,
              rest_time: block.restTime,
              last_changed: new Date().toISOString(),
            });
          })
          .catch(console.error);
      }

      return updatedPlan;
    });
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
      setCurrentPlan((prev) => {
        const updatedSessions = [...prev.sessions];
        const block = updatedSessions[sessionIndex].exercises.find(
          (e) => e.id === blockId
        ) as TrainingBlock;
        if (!block) return prev;

        const exerciseToDelete = block.selectedExercises.find(
          (e) => e.id === exerciseId
        );
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

        const updatedPlan = { ...prev, sessions: updatedSessions };

        // Only update database if model/plan is not new
        if ((isModel && !isNewModel) || (!isModel && !isNewTrainingPlan)) {
          // Update database and queue for sync
          updateSession(updatedSessions[sessionIndex])
            .then(() => {
              if (exerciseToDelete) {
                // Queue exercise deletion - critical priority as it's destructive
                queueCriticalChange("selected_exercises", exerciseId, "delete");
              }

              if (block.selectedExercises.length === 0) {
                // Queue block deletion if empty - critical priority
                queueCriticalChange("training_blocks", blockId, "delete");
              }
            })
            .catch(console.error);
        }

        return updatedPlan;
      });
    } else {
      setCurrentPlan((prev) => {
        const updatedSessions = [...prev.sessions];
        updatedSessions[sessionIndex].exercises = updatedSessions[
          sessionIndex
        ].exercises.filter((exercise) => exercise.id !== exerciseId);
        const updatedPlan = { ...prev, sessions: updatedSessions };

        // Only update database if model/plan is not new
        if ((isModel && !isNewModel) || (!isModel && !isNewTrainingPlan)) {
          // Update database and queue for sync
          updateSession(updatedSessions[sessionIndex])
            .then(() => {
              // Queue exercise deletion - critical priority as it's destructive
              queueCriticalChange("selected_exercises", exerciseId, "delete");
            })
            .catch(console.error);
        }

        return updatedPlan;
      });
    }
  };

  const resetPlan = () => {
    setPlanState(defaultPlanState);
    setIsNewTrainingPlan(true);
  };

  const resetModelState = () => {
    setModel({
      ...defaultPlanState,
      id: uuidv4(),
      name: "",
      description: "",
    });
    setIsNewModel(true);
  };

  // Helper functions for updating individual exercise properties
  const updateExerciseProperty = async (
    sessionIndex: number,
    exerciseId: string,
    property: keyof SelectedExercise,
    value: any,
    blockId?: string,
    isModel: boolean = false
  ) => {
    const currentPlan = isModel ? model : planState;
    const setCurrentPlan = isModel ? setModel : setPlanState;

    setCurrentPlan((prev) => {
      const updatedSessions = [...prev.sessions];

      if (blockId) {
        const block = updatedSessions[sessionIndex].exercises.find(
          (e) => e.id === blockId
        ) as TrainingBlock;
        if (!block) return prev;

        const exerciseIndex = block.selectedExercises.findIndex(
          (e) => e.id === exerciseId
        );
        if (exerciseIndex === -1) return prev;

        const updatedExercise = {
          ...block.selectedExercises[exerciseIndex],
          last_changed: new Date().toISOString(),
        };
        (updatedExercise as any)[property] = value;

        const updatedBlock = {
          ...block,
          selectedExercises: block.selectedExercises.map((e, index) =>
            index === exerciseIndex ? updatedExercise : e
          ),
          last_changed: new Date().toISOString(),
        };

        updatedSessions[sessionIndex].exercises = updatedSessions[
          sessionIndex
        ].exercises.map((e) => (e.id === blockId ? updatedBlock : e));

        // Only update database if model/plan is not new
        if ((isModel && !isNewModel) || (!isModel && !isNewTrainingPlan)) {
          // Update database and queue for sync
          updateTrainingBlock(updatedBlock)
            .then(() => {
              // Queue exercise property update - medium priority for most properties
              const priority = ["comments"].includes(property as string)
                ? SyncPriority.LOW
                : SyncPriority.MEDIUM;

              // Map frontend property name to database column name
              const dbColumn = mapPropertyToDbColumn(property as string);

              queueMediumChange("selected_exercises", exerciseId, "update", {
                id: exerciseId,
                [dbColumn]: value,
                last_changed: updatedExercise.last_changed,
              });
            })
            .catch(console.error);
        }
      } else {
        const exerciseIndex = updatedSessions[sessionIndex].exercises.findIndex(
          (e) => e.id === exerciseId
        );
        if (exerciseIndex === -1) return prev;

        const updatedExercise = {
          ...updatedSessions[sessionIndex].exercises[exerciseIndex],
          last_changed: new Date().toISOString(),
        } as SelectedExercise;
        (updatedExercise as any)[property] = value;

        updatedSessions[sessionIndex].exercises = updatedSessions[
          sessionIndex
        ].exercises.map((e, index) =>
          index === exerciseIndex ? updatedExercise : e
        );

        // Only update database if model/plan is not new
        if ((isModel && !isNewModel) || (!isModel && !isNewTrainingPlan)) {
          // Update database and queue for sync
          updateSelectedExercise(updatedExercise)
            .then(() => {
              // Queue exercise property update - medium priority for most properties
              const priority = ["comments"].includes(property as string)
                ? SyncPriority.LOW
                : SyncPriority.MEDIUM;

              // Map frontend property name to database column name
              const dbColumn = mapPropertyToDbColumn(property as string);

              queueMediumChange("selected_exercises", exerciseId, "update", {
                id: exerciseId,
                [dbColumn]: value,
                last_changed: updatedExercise.last_changed,
              });
            })
            .catch(console.error);
        }
      }

      const updatedPlan = { ...prev, sessions: updatedSessions };

      return updatedPlan;
    });
  };

  const updateExerciseProgression = async (
    sessionIndex: number,
    exerciseId: string,
    weekIndex: number,
    field: keyof Progression,
    value: string | number,
    blockId?: string,
    isModel: boolean = false
  ) => {
    const currentPlan = isModel ? model : planState;
    const setCurrentPlan = isModel ? setModel : setPlanState;

    setCurrentPlan((prev) => {
      const updatedSessions = [...prev.sessions];

      if (blockId) {
        const block = updatedSessions[sessionIndex].exercises.find(
          (e) => e.id === blockId
        ) as TrainingBlock;
        if (!block) return prev;

        const exerciseIndex = block.selectedExercises.findIndex(
          (e) => e.id === exerciseId
        );
        if (exerciseIndex === -1) return prev;

        const updatedExercise = {
          ...block.selectedExercises[exerciseIndex],
          last_changed: new Date().toISOString(),
        };
        const updatedProgression = [...updatedExercise.progression];

        if (updatedProgression[weekIndex]) {
          updatedProgression[weekIndex] = {
            ...updatedProgression[weekIndex],
            [field]: value,
          };
          updatedExercise.progression = updatedProgression;
        }

        const updatedBlock = {
          ...block,
          selectedExercises: block.selectedExercises.map((e, index) =>
            index === exerciseIndex ? updatedExercise : e
          ),
          last_changed: new Date().toISOString(),
        };

        updatedSessions[sessionIndex].exercises = updatedSessions[
          sessionIndex
        ].exercises.map((e) => (e.id === blockId ? updatedBlock : e));

        // Only update database if model/plan is not new
        if ((isModel && !isNewModel) || (!isModel && !isNewTrainingPlan)) {
          // Update database and queue for sync
          updateTrainingBlock(updatedBlock)
            .then(async () => {
              // Get the proper progression UUID
              const progressionId = await getProgressionId(
                null,
                blockId,
                weekIndex + 1
              );

              if (progressionId) {
                // Queue progression update with proper UUID - medium priority
                queueMediumChange("progressions", progressionId, "update", {
                  id: progressionId,
                  training_block_id: blockId,
                  series: updatedProgression[weekIndex].series,
                  repetitions: updatedProgression[weekIndex].repetitions,
                  effort: updatedProgression[weekIndex].effort,
                  week_number: weekIndex + 1,
                  last_changed: new Date().toISOString(),
                });
              } else {
                console.warn(
                  `Could not find progression ID for training block ${blockId}, week ${
                    weekIndex + 1
                  }`
                );
              }
            })
            .catch(console.error);
        }
      } else {
        const exerciseIndex = updatedSessions[sessionIndex].exercises.findIndex(
          (e) => e.id === exerciseId
        );
        if (exerciseIndex === -1) return prev;

        const updatedExercise = {
          ...updatedSessions[sessionIndex].exercises[exerciseIndex],
          last_changed: new Date().toISOString(),
        } as SelectedExercise;
        const updatedProgression = [...updatedExercise.progression];

        if (updatedProgression[weekIndex]) {
          updatedProgression[weekIndex] = {
            ...updatedProgression[weekIndex],
            [field]: value,
          };
          updatedExercise.progression = updatedProgression;
        }

        updatedSessions[sessionIndex].exercises = updatedSessions[
          sessionIndex
        ].exercises.map((e, index) =>
          index === exerciseIndex ? updatedExercise : e
        );

        // Only update database if model/plan is not new
        if ((isModel && !isNewModel) || (!isModel && !isNewTrainingPlan)) {
          // Update database and queue for sync
          updateSelectedExercise(updatedExercise)
            .then(async () => {
              // Get the proper progression UUID
              const progressionId = await getProgressionId(
                exerciseId,
                null,
                weekIndex + 1
              );

              if (progressionId) {
                // Queue progression update with proper UUID - medium priority
                queueMediumChange("progressions", progressionId, "update", {
                  id: progressionId,
                  selected_exercise_id: exerciseId,
                  series: updatedProgression[weekIndex].series,
                  repetitions: updatedProgression[weekIndex].repetitions,
                  effort: updatedProgression[weekIndex].effort,
                  week_number: weekIndex + 1,
                  last_changed: new Date().toISOString(),
                });
              } else {
                console.warn(
                  `Could not find progression ID for selected exercise ${exerciseId}, week ${
                    weekIndex + 1
                  }`
                );
              }
            })
            .catch(console.error);
        }
      }

      const updatedPlan = { ...prev, sessions: updatedSessions };

      return updatedPlan;
    });
  };

  // Manual save functions - call these explicitly when user wants to create/save
  const saveNewTrainingPlan = async (updatedPlan?: PlanState) => {
    try {
      const planToSave = updatedPlan || planState;
      await saveTrainingPlan(planToSave, user.id);
      // Queue initial plan creation - critical priority
      queueCriticalChange("training_plans", planToSave.id, "insert", {
        id: planToSave.id,
        n_of_weeks: planToSave.nOfWeeks,
        n_of_sessions: planToSave.nOfSessions,
        user_id: user.id,
        last_changed: new Date().toISOString(),
      });
      // Mark as no longer new so subsequent updates will sync to database
      setIsNewTrainingPlan(false);
      console.log("✅ Training plan saved and queued for sync");
    } catch (error) {
      console.error("❌ Error saving training plan:", error);
      throw error;
    }
  };

  const saveNewTrainingModel = async (updatedModel?: TrainingModel) => {
    try {
      const modelToSave = updatedModel || model;
      await saveTrainingModel(modelToSave, user.id);

      // For a new training model, the trainingPlanId should be the underlying plan's ID
      // If trainingPlanId is not set, use the model's ID as the plan ID (since the model IS based on a plan)
      const trainingPlanId = modelToSave.trainingPlanId || modelToSave.id;

      console.log(
        `🔄 Saving training model - Plan ID: ${trainingPlanId}, Model ID: ${modelToSave.id}`
      );

      // Create a minimal training plan record for immediate sync
      const trainingPlanData = {
        id: trainingPlanId,
        n_of_weeks: modelToSave.nOfWeeks,
        n_of_sessions: modelToSave.nOfSessions,
        user_id: user.id,
        last_changed: new Date().toISOString(),
      };

      // Queue the training plan first with critical priority
      queueCriticalChange(
        "training_plans",
        trainingPlanId,
        "insert",
        trainingPlanData
      );

      // Force immediate sync of the training plan using table-level sync to ensure it exists remotely
      try {
        await syncSpecificTable("training_plans", true); // Force sync the training_plans table
        console.log("✅ Training plan synced to remote database");
      } catch (syncError) {
        console.error("❌ Failed to sync training plan:", syncError);
        // Continue anyway - the model sync might still work if the plan was already synced
      }

      // Queue all sessions for this training model - high priority
      modelToSave.sessions.forEach((session) => {
        queueHighChange("sessions", session.id, "insert", {
          id: session.id,
          plan_id: trainingPlanId,
          name: session.name,
          last_changed: session.last_changed || new Date().toISOString(),
        });

        // Queue session days
        session.days.forEach((day) => {
          const sessionDayId = uuidv4();
          queueMediumChange("session_days", sessionDayId, "insert", {
            id: sessionDayId,
            session_id: session.id,
            day_name: day,
            last_changed: new Date().toISOString(),
          });
        });

        // Queue exercises and training blocks
        session.exercises.forEach((exercise) => {
          if (exercise.type === "selectedExercise") {
            queueHighChange("selected_exercises", exercise.id, "insert", {
              id: exercise.id,
              session_id: session.id,
              exercise_id: exercise.exerciseId,
              block_id: exercise.blockId || null,
              series: exercise.series,
              repetitions: exercise.repetitions,
              effort: exercise.effort,
              rest_time: exercise.restTime,
              comments: exercise.comments,
              last_changed: exercise.last_changed || new Date().toISOString(),
            });
          } else if (exercise.type === "trainingBlock") {
            queueHighChange("training_blocks", exercise.id, "insert", {
              id: exercise.id,
              session_id: session.id,
              name: exercise.name,
              series: exercise.series,
              repetitions: exercise.repetitions,
              effort: exercise.effort,
              block_model: exercise.blockModel,
              comments: exercise.comments,
              rest_time: exercise.restTime,
              last_changed: exercise.last_changed || new Date().toISOString(),
            });
          }
        });
      });

      // Finally queue the training model creation with HIGH priority
      // Since we've already synced the training plan, this should work
      queueHighChange("training_models", modelToSave.id, "insert", {
        id: modelToSave.id,
        name: modelToSave.name,
        description: modelToSave.description,
        training_plan_id: trainingPlanId,
        last_changed: new Date().toISOString(),
      });

      // Mark as no longer new so subsequent updates will sync to database
      setIsNewModel(false);
      console.log(
        "✅ Training model and underlying training plan saved and queued for sync"
      );
    } catch (error) {
      console.error("❌ Error saving training model:", error);
      throw error;
    }
  };

  return (
    <NewPlanContext.Provider
      value={{
        planState,
        setPlanState,
        updateWeeks,
        linkTrainingPlanToModel,
        unlinkTrainingPlanFromModel,
        addSession,
        updateSession: updateSessionFunc,
        removeSession,
        addTrainingBlock,
        updateTrainingBlock: updateTrainingBlockFunc,
        removeExercise,
        resetPlan,
        updateNOfSessions,
        currentExerciseBlock,
        setCurrentExerciseBlock,
        currentSelectedExercise,
        setCurrentSelectedExercise,
        saveSelectedExercise,
        model,
        setModel,
        resetModelState,
        updateExerciseProperty,
        updateExerciseProgression,
        // Manual save functions
        saveNewTrainingPlan,
        saveNewTrainingModel,
        // New boolean flags to track if model/plan are new
        isNewModel,
        isNewTrainingPlan,
        setIsNewModel,
        setIsNewTrainingPlan,
        // Expose sync functionality
        syncStats,
        isProcessing,
        forceSyncAll,
        updateModelName,
        updateModelDescription,
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
