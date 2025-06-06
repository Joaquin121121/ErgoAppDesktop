import { useCallback } from "react";
import { useRecordSync, SyncPriority } from "./useRecordSync";
import {
  updateTrainingPlanMetadata,
  updateTrainingModelMetadata,
  updateSession,
  updateSelectedExercise,
  updateTrainingBlock,
  saveTrainingPlan,
  saveTrainingModel,
} from "./parseTrainingData";
import {
  PlanState,
  TrainingModel,
  Session,
  SelectedExercise,
  TrainingBlock,
} from "../types/trainingPlan";
import { v4 as uuidv4 } from "uuid";

export function useTrainingPlanSync() {
  const {
    queueCriticalChange,
    queueHighChange,
    queueMediumChange,
    queueLowChange,
    syncStats,
    isProcessing,
    forceSyncAll,
  } = useRecordSync();

  // Training plan metadata operations
  const updatePlanWeeks = useCallback(
    async (planId: string, weeks: number, isModel: boolean = false) => {
      try {
        await updateTrainingPlanMetadata(planId, { nOfWeeks: weeks });

        // Queue for sync with low priority (metadata change)
        queueLowChange("training_plans", planId, "update", {
          id: planId,
          n_of_weeks: weeks,
          last_changed: new Date().toISOString(),
        });

        if (isModel) {
          await updateTrainingModelMetadata(planId, {});
        }
      } catch (error) {
        console.error("Error updating plan weeks:", error);
        throw error;
      }
    },
    [queueLowChange]
  );

  const updatePlanSessions = useCallback(
    async (planId: string, nOfSessions: number, isModel: boolean = false) => {
      try {
        await updateTrainingPlanMetadata(planId, { nOfSessions });

        // Queue for sync with low priority (metadata change)
        queueLowChange("training_plans", planId, "update", {
          id: planId,
          n_of_sessions: nOfSessions,
          last_changed: new Date().toISOString(),
        });

        if (isModel) {
          await updateTrainingModelMetadata(planId, {});
        }
      } catch (error) {
        console.error("Error updating plan sessions:", error);
        throw error;
      }
    },
    [queueLowChange]
  );

  // Training plan to model relationship operations
  const linkTrainingPlanToModel = useCallback(
    async (planId: string, modelId: string) => {
      try {
        // Queue for sync with medium priority (affects functionality)
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
    },
    [queueMediumChange]
  );

  const unlinkTrainingPlanFromModel = useCallback(
    async (planId: string, modelId: string) => {
      try {
        // Queue for sync with medium priority (affects functionality)
        queueMediumChange(
          "training_plan_models",
          `${planId}_${modelId}`,
          "delete"
        );
      } catch (error) {
        console.error("Error unlinking training plan from model:", error);
        throw error;
      }
    },
    [queueMediumChange]
  );

  // Session operations
  const createSession = useCallback(
    async (session: Session) => {
      try {
        await updateSession(session);

        // Queue for sync with high priority (user content)
        queueHighChange("sessions", session.id, "insert", {
          id: session.id,
          plan_id: session.planId,
          name: session.name,
          last_changed: session.last_changed || new Date().toISOString(),
        });

        // Queue session days
        session.days.forEach((day, index) => {
          const sessionDayId = uuidv4(); // Generate proper UUID
          queueHighChange("session_days", sessionDayId, "insert", {
            id: sessionDayId,
            session_id: session.id,
            day_name: day,
            last_changed: new Date().toISOString(),
          });
        });
      } catch (error) {
        console.error("Error creating session:", error);
        throw error;
      }
    },
    [queueHighChange]
  );

  const updateSessionData = useCallback(
    async (session: Session) => {
      try {
        await updateSession(session);

        // Queue for sync with high priority (user content)
        queueHighChange("sessions", session.id, "update", {
          id: session.id,
          plan_id: session.planId,
          name: session.name,
          last_changed: session.last_changed || new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error updating session:", error);
        throw error;
      }
    },
    [queueHighChange]
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        // Queue for sync with critical priority (destructive operation)
        queueCriticalChange("sessions", sessionId, "delete");
      } catch (error) {
        console.error("Error deleting session:", error);
        throw error;
      }
    },
    [queueCriticalChange]
  );

  // Exercise operations
  const createSelectedExercise = useCallback(
    async (exercise: SelectedExercise) => {
      try {
        await updateSelectedExercise(exercise);

        // Queue for sync with high priority (user content)
        queueHighChange("selected_exercises", exercise.id, "insert", {
          id: exercise.id,
          session_id: exercise.sessionId,
          exercise_id: exercise.exerciseId,
          block_id: exercise.blockId || null,
          series: exercise.series,
          repetitions: exercise.repetitions,
          effort: exercise.effort,
          rest_time: exercise.restTime,
          comments: exercise.comments,
          last_changed: exercise.last_changed || new Date().toISOString(),
        });

        // Queue progressions
        exercise.progression.forEach((prog, index) => {
          const progressionId = uuidv4(); // Generate proper UUID
          queueMediumChange("progressions", progressionId, "insert", {
            id: progressionId,
            selected_exercise_id: exercise.id,
            series: prog.series,
            repetitions: prog.repetitions,
            effort: prog.effort,
            week_number: index + 1,
            last_changed: new Date().toISOString(),
          });
        });
      } catch (error) {
        console.error("Error creating selected exercise:", error);
        throw error;
      }
    },
    [queueHighChange, queueMediumChange]
  );

  const updateSelectedExerciseData = useCallback(
    async (exercise: SelectedExercise) => {
      try {
        await updateSelectedExercise(exercise);

        // Queue for sync with medium priority (content change)
        queueMediumChange("selected_exercises", exercise.id, "update", {
          id: exercise.id,
          session_id: exercise.sessionId,
          exercise_id: exercise.exerciseId,
          block_id: exercise.blockId || null,
          series: exercise.series,
          repetitions: exercise.repetitions,
          effort: exercise.effort,
          rest_time: exercise.restTime,
          comments: exercise.comments,
          last_changed: exercise.last_changed || new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error updating selected exercise:", error);
        throw error;
      }
    },
    [queueMediumChange]
  );

  const deleteSelectedExercise = useCallback(
    async (exerciseId: string) => {
      try {
        // Queue for sync with critical priority (destructive operation)
        queueCriticalChange("selected_exercises", exerciseId, "delete");
      } catch (error) {
        console.error("Error deleting selected exercise:", error);
        throw error;
      }
    },
    [queueCriticalChange]
  );

  // Training block operations
  const createTrainingBlock = useCallback(
    async (block: TrainingBlock) => {
      try {
        await updateTrainingBlock(block);

        // Queue for sync with high priority (user content)
        queueHighChange("training_blocks", block.id, "insert", {
          id: block.id,
          session_id: block.sessionId,
          name: block.name,
          series: block.series,
          repetitions: block.repetitions,
          effort: block.effort,
          block_model: block.blockModel,
          comments: block.comments,
          rest_time: block.restTime,
          last_changed: block.last_changed || new Date().toISOString(),
        });

        // Queue progressions for the block with proper UUIDs
        block.progression.forEach((prog, index) => {
          const progressionId = uuidv4(); // Generate proper UUID
          queueMediumChange("progressions", progressionId, "insert", {
            id: progressionId,
            training_block_id: block.id,
            series: prog.series,
            repetitions: prog.repetitions,
            effort: prog.effort,
            week_number: index + 1,
            last_changed: new Date().toISOString(),
          });
        });

        // Queue exercises within the block
        block.selectedExercises.forEach((exercise) => {
          queueHighChange("selected_exercises", exercise.id, "insert", {
            id: exercise.id,
            session_id: exercise.sessionId,
            exercise_id: exercise.exerciseId,
            block_id: block.id,
            series: exercise.series,
            repetitions: exercise.repetitions,
            effort: exercise.effort,
            rest_time: exercise.restTime,
            comments: exercise.comments,
            last_changed: exercise.last_changed || new Date().toISOString(),
          });
        });
      } catch (error) {
        console.error("Error creating training block:", error);
        throw error;
      }
    },
    [queueHighChange, queueMediumChange]
  );

  const updateTrainingBlockData = useCallback(
    async (block: TrainingBlock) => {
      try {
        await updateTrainingBlock(block);

        // Queue for sync with high priority (user content)
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
          last_changed: block.last_changed || new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error updating training block:", error);
        throw error;
      }
    },
    [queueHighChange]
  );

  const deleteTrainingBlock = useCallback(
    async (blockId: string) => {
      try {
        // Queue for sync with critical priority (destructive operation)
        queueCriticalChange("training_blocks", blockId, "delete");
      } catch (error) {
        console.error("Error deleting training block:", error);
        throw error;
      }
    },
    [queueCriticalChange]
  );

  // Training model operations
  const deleteTrainingModel = useCallback(
    async (modelId: string) => {
      try {
        // Queue for sync with critical priority (destructive operation)
        queueCriticalChange("training_models", modelId, "delete");
      } catch (error) {
        console.error("Error deleting training model:", error);
        throw error;
      }
    },
    [queueCriticalChange]
  );

  // Model operations
  const createTrainingPlan = useCallback(
    async (plan: PlanState, userId: string) => {
      try {
        await saveTrainingPlan(plan, userId);

        // Queue for sync with critical priority (new plan creation)
        queueCriticalChange("training_plans", plan.id, "insert", {
          id: plan.id,
          n_of_weeks: plan.nOfWeeks,
          n_of_sessions: plan.nOfSessions,
          user_id: userId,
          last_changed: plan.last_changed || new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error creating training plan:", error);
        throw error;
      }
    },
    [queueCriticalChange]
  );

  const createTrainingModelData = useCallback(
    async (model: TrainingModel, userId: string) => {
      try {
        await saveTrainingModel(model, userId);

        // Queue for sync with critical priority (new model creation)
        queueCriticalChange("training_models", model.id, "insert", {
          name: model.name,
          description: model.description,
          training_plan_id: model.id,
          last_changed: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error creating training model:", error);
        throw error;
      }
    },
    [queueCriticalChange]
  );

  return {
    // Plan metadata operations
    updatePlanWeeks,
    updatePlanSessions,

    // Training plan to model relationship operations
    linkTrainingPlanToModel,
    unlinkTrainingPlanFromModel,

    // Session operations
    createSession,
    updateSessionData,
    deleteSession,

    // Exercise operations
    createSelectedExercise,
    updateSelectedExerciseData,
    deleteSelectedExercise,

    // Training block operations
    createTrainingBlock,
    updateTrainingBlockData,
    deleteTrainingBlock,

    // Training model operations
    deleteTrainingModel,

    // Model operations
    createTrainingPlan,
    createTrainingModelData,

    // Sync state
    syncStats,
    isProcessing,
    forceSyncAll,
  };
}
