import Database from "@tauri-apps/plugin-sql";
import { v4 as uuidv4 } from "uuid";
import {
  PlanState,
  TrainingModel,
  Session,
  SelectedExercise,
  TrainingBlock,
  Exercise,
  Progression,
  VolumeReduction,
  EffortReduction,
} from "../types/trainingPlan";

// Raw database interfaces
interface RawTrainingPlan {
  id: string;
  n_of_weeks: number;
  n_of_sessions: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface RawTrainingModel {
  id: string;
  name: string;
  description: string | null;
  training_plan_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface RawSession {
  id: string;
  plan_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface RawSessionDay {
  id: string;
  session_id: string;
  day_name: string;
  created_at: string;
  deleted_at: string | null;
}

interface RawTrainingBlock {
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

interface RawSelectedExercise {
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

interface RawExercise {
  id: string;
  name: string;
  video_ref: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface RawProgression {
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

interface RawVolumeReduction {
  id: string;
  selected_exercise_id: string | null;
  training_block_id: string | null;
  fatigue_level: string;
  reduction_percentage: number;
  created_at: string;
  deleted_at: string | null;
}

interface RawEffortReduction {
  id: string;
  selected_exercise_id: string | null;
  training_block_id: string | null;
  effort_level: string;
  reduction_amount: number;
  created_at: string;
  deleted_at: string | null;
}

// Get all training plans for a user
const getTrainingPlans = async (
  userId: string,
  skipModelLoading: boolean = false,
  isLoadingOperation: boolean = false
): Promise<PlanState[]> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    if (isLoadingOperation) {
      console.log(
        `📖 Loading training plans for user ${userId} (read-only operation)`
      );
    }

    // 1. Get all training plans for the user
    const rawPlans = await db.select(
      "SELECT * FROM training_plans WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC",
      [userId]
    );

    const plans: PlanState[] = [];

    for (const rawPlan of rawPlans) {
      // 2. Get sessions for this plan
      const rawSessions = await db.select(
        "SELECT * FROM sessions WHERE plan_id = ? AND deleted_at IS NULL ORDER BY created_at ASC",
        [rawPlan.id]
      );

      const sessions: Session[] = [];

      for (const rawSession of rawSessions) {
        // 3. Get session days
        const rawSessionDays = await db.select(
          "SELECT * FROM session_days WHERE session_id = ? AND deleted_at IS NULL ORDER BY created_at ASC",
          [rawSession.id]
        );

        const days = rawSessionDays.map((day: RawSessionDay) => day.day_name);

        // 4. Get exercises and training blocks for this session
        const exercises: (SelectedExercise | TrainingBlock)[] = [];

        // Get training blocks
        const rawBlocks = await db.select(
          "SELECT * FROM training_blocks WHERE session_id = ? AND deleted_at IS NULL ORDER BY created_at ASC",
          [rawSession.id]
        );

        for (const rawBlock of rawBlocks) {
          // Get progressions for block
          const blockProgressions = await getProgressions(
            null,
            rawBlock.id,
            db
          );

          // Get volume reductions for block
          const blockVolumeReductions = await getVolumeReductions(
            null,
            rawBlock.id,
            db
          );

          // Get effort reductions for block
          const blockEffortReductions = await getEffortReductions(
            null,
            rawBlock.id,
            db
          );

          // Get selected exercises within this block
          const rawBlockExercises = await db.select(
            "SELECT se.*, e.name as exercise_name FROM selected_exercises se JOIN exercises e ON se.exercise_id = e.id WHERE se.block_id = ? AND se.deleted_at IS NULL ORDER BY se.created_at ASC",
            [rawBlock.id]
          );

          const selectedExercises: SelectedExercise[] = [];
          for (const rawExercise of rawBlockExercises) {
            const exerciseProgressions = await getProgressions(
              rawExercise.id,
              null,
              db
            );
            const exerciseVolumeReductions = await getVolumeReductions(
              rawExercise.id,
              null,
              db
            );
            const exerciseEffortReductions = await getEffortReductions(
              rawExercise.id,
              null,
              db
            );

            selectedExercises.push({
              type: "selectedExercise",
              id: rawExercise.id,
              sessionId: rawExercise.session_id,
              name: rawExercise.exercise_name,
              exerciseId: rawExercise.exercise_id,
              series: rawExercise.series,
              repetitions: rawExercise.repetitions,
              effort: rawExercise.effort,
              restTime: rawExercise.rest_time,
              progression: exerciseProgressions,
              comments: rawExercise.comments || "",
              blockId: rawExercise.block_id,
              reduceVolume: exerciseVolumeReductions,
              reduceEffort: exerciseEffortReductions,
            });
          }

          const trainingBlock: TrainingBlock = {
            type: "trainingBlock",
            id: rawBlock.id,
            sessionId: rawBlock.session_id,
            name: rawBlock.name,
            series: rawBlock.series,
            repetitions: rawBlock.repetitions,
            effort: rawBlock.effort,
            selectedExercises,
            exercisesInSeries: selectedExercises, // Same as selectedExercises
            blockModel: rawBlock.block_model,
            progression: blockProgressions,
            comments: rawBlock.comments || "",
            restTime: rawBlock.rest_time,
            reduceVolume: blockVolumeReductions,
            reduceEffort: blockEffortReductions,
          };

          exercises.push(trainingBlock);
        }

        // Get direct selected exercises (not in blocks)
        const rawDirectExercises = await db.select(
          "SELECT se.*, e.name as exercise_name FROM selected_exercises se JOIN exercises e ON se.exercise_id = e.id WHERE se.session_id = ? AND se.block_id IS NULL AND se.deleted_at IS NULL ORDER BY se.created_at ASC",
          [rawSession.id]
        );

        for (const rawExercise of rawDirectExercises) {
          const exerciseProgressions = await getProgressions(
            rawExercise.id,
            null,
            db
          );
          const exerciseVolumeReductions = await getVolumeReductions(
            rawExercise.id,
            null,
            db
          );
          const exerciseEffortReductions = await getEffortReductions(
            rawExercise.id,
            null,
            db
          );

          const selectedExercise: SelectedExercise = {
            type: "selectedExercise",
            id: rawExercise.id,
            sessionId: rawExercise.session_id,
            name: rawExercise.exercise_name,
            exerciseId: rawExercise.exercise_id,
            series: rawExercise.series,
            repetitions: rawExercise.repetitions,
            effort: rawExercise.effort,
            restTime: rawExercise.rest_time,
            progression: exerciseProgressions,
            comments: rawExercise.comments || "",
            reduceVolume: exerciseVolumeReductions,
            reduceEffort: exerciseEffortReductions,
          };

          exercises.push(selectedExercise);
        }

        const session: Session = {
          id: rawSession.id,
          planId: rawSession.plan_id,
          name: rawSession.name,
          days,
          exercises,
        };

        sessions.push(session);
      }

      const plan: PlanState = {
        id: rawPlan.id,
        nOfWeeks: rawPlan.n_of_weeks,
        sessions,
        nOfSessions: rawPlan.n_of_sessions,
      };

      plans.push(plan);
    }

    return plans;
  } catch (error) {
    console.error("Error getting training plans:", error);
    return [];
  }
};

// Helper function to get progressions
const getProgressions = async (
  selectedExerciseId: string | null,
  trainingBlockId: string | null,
  db: any
): Promise<Progression[]> => {
  let query: string;
  let params: any[];

  if (selectedExerciseId) {
    query =
      "SELECT * FROM progressions WHERE selected_exercise_id = ? AND deleted_at IS NULL ORDER BY week_number ASC";
    params = [selectedExerciseId];
  } else if (trainingBlockId) {
    query =
      "SELECT * FROM progressions WHERE training_block_id = ? AND deleted_at IS NULL ORDER BY week_number ASC";
    params = [trainingBlockId];
  } else {
    return [];
  }

  const rawProgressions = await db.select(query, params);
  return rawProgressions.map((prog: RawProgression) => ({
    series: prog.series,
    repetitions: prog.repetitions,
    effort: prog.effort,
  }));
};

// Helper function to get volume reductions
const getVolumeReductions = async (
  selectedExerciseId: string | null,
  trainingBlockId: string | null,
  db: any
): Promise<VolumeReduction> => {
  let query: string;
  let params: any[];

  if (selectedExerciseId) {
    query =
      "SELECT * FROM volume_reductions WHERE selected_exercise_id = ? AND deleted_at IS NULL";
    params = [selectedExerciseId];
  } else if (trainingBlockId) {
    query =
      "SELECT * FROM volume_reductions WHERE training_block_id = ? AND deleted_at IS NULL";
    params = [trainingBlockId];
  } else {
    return {};
  }

  const rawReductions = await db.select(query, params);
  const reductions: VolumeReduction = {};

  rawReductions.forEach((reduction: RawVolumeReduction) => {
    reductions[reduction.fatigue_level] = reduction.reduction_percentage;
  });

  return reductions;
};

// Helper function to get effort reductions
const getEffortReductions = async (
  selectedExerciseId: string | null,
  trainingBlockId: string | null,
  db: any
): Promise<EffortReduction> => {
  let query: string;
  let params: any[];

  if (selectedExerciseId) {
    query =
      "SELECT * FROM effort_reductions WHERE selected_exercise_id = ? AND deleted_at IS NULL";
    params = [selectedExerciseId];
  } else if (trainingBlockId) {
    query =
      "SELECT * FROM effort_reductions WHERE training_block_id = ? AND deleted_at IS NULL";
    params = [trainingBlockId];
  } else {
    return {};
  }

  const rawReductions = await db.select(query, params);
  const reductions: EffortReduction = {};

  rawReductions.forEach((reduction: RawEffortReduction) => {
    reductions[reduction.effort_level] = reduction.reduction_amount;
  });

  return reductions;
};

// Get all exercises
const getExercises = async (): Promise<Exercise[]> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    const rawExercises = await db.select(
      "SELECT * FROM exercises WHERE deleted_at IS NULL ORDER BY name ASC"
    );

    return rawExercises.map((exercise: RawExercise) => ({
      id: exercise.id,
      name: exercise.name,
      videoRef: exercise.video_ref || "",
    }));
  } catch (error) {
    console.error("Error getting exercises:", error);
    return [];
  }
};

// Save or update a training plan
const saveTrainingPlan = async (
  planState: PlanState,
  userId: string,
  externalDb?: any
): Promise<void> => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    // Generate ID if not provided
    const planId = planState.id || uuidv4();

    // Check if plan exists
    const existingPlan = await dbToUse.select(
      "SELECT id FROM training_plans WHERE id = ? AND deleted_at IS NULL",
      [planId]
    );

    if (existingPlan.length > 0) {
      // Use updateTrainingPlan for existing plans
      await updateTrainingPlan({ ...planState, id: planId }, userId, dbToUse);
    } else {
      // Insert new plan
      const now = new Date().toISOString();
      await dbToUse.execute(
        `INSERT INTO training_plans (id, n_of_weeks, n_of_sessions, user_id, created_at, last_changed)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [planId, planState.nOfWeeks, planState.nOfSessions, userId, now, now]
      );

      // Save sessions for new plan
      for (const session of planState.sessions) {
        await saveSession(session, planId, dbToUse);
      }
    }

    if (isManagingTransaction) {
      await dbToUse.execute("COMMIT");
    }
  } catch (error) {
    if (isManagingTransaction) {
      console.error("Error saving training plan, rolling back:", error);
      await dbToUse.execute("ROLLBACK");
    }
    throw error;
  }
};

// Helper function to save a session
const saveSession = async (
  session: Session,
  planId: string,
  db: any
): Promise<void> => {
  const sessionId = session.id || uuidv4();
  const now = new Date().toISOString();

  // Delete any existing session and its related data in correct order (hard delete to avoid UNIQUE constraint issues)
  // First delete the most dependent records (progressions, reductions)
  await db.execute(
    "DELETE FROM progressions WHERE selected_exercise_id IN (SELECT id FROM selected_exercises WHERE session_id = ?)",
    [sessionId]
  );
  await db.execute(
    "DELETE FROM progressions WHERE training_block_id IN (SELECT id FROM training_blocks WHERE session_id = ?)",
    [sessionId]
  );
  await db.execute(
    "DELETE FROM volume_reductions WHERE selected_exercise_id IN (SELECT id FROM selected_exercises WHERE session_id = ?)",
    [sessionId]
  );
  await db.execute(
    "DELETE FROM volume_reductions WHERE training_block_id IN (SELECT id FROM training_blocks WHERE session_id = ?)",
    [sessionId]
  );
  await db.execute(
    "DELETE FROM effort_reductions WHERE selected_exercise_id IN (SELECT id FROM selected_exercises WHERE session_id = ?)",
    [sessionId]
  );
  await db.execute(
    "DELETE FROM effort_reductions WHERE training_block_id IN (SELECT id FROM training_blocks WHERE session_id = ?)",
    [sessionId]
  );

  // Then delete selected exercises and training blocks
  await db.execute("DELETE FROM selected_exercises WHERE session_id = ?", [
    sessionId,
  ]);
  await db.execute("DELETE FROM training_blocks WHERE session_id = ?", [
    sessionId,
  ]);

  // Then delete session days
  await db.execute("DELETE FROM session_days WHERE session_id = ?", [
    sessionId,
  ]);

  // Finally delete the session itself
  await db.execute("DELETE FROM sessions WHERE id = ?", [sessionId]);

  // Insert session
  await db.execute(
    `INSERT INTO sessions (id, plan_id, name, created_at, last_changed) VALUES (?, ?, ?, ?, ?)`,
    [sessionId, planId, session.name, now, now]
  );

  // Insert session days
  for (const day of session.days) {
    await db.execute(
      `INSERT INTO session_days (id, session_id, day_name, created_at, last_changed) VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), sessionId, day, now, now]
    );
  }

  // Insert exercises and blocks
  for (const exercise of session.exercises) {
    if (exercise.type === "selectedExercise") {
      await saveSelectedExercise(exercise, sessionId, null, db);
    } else if (exercise.type === "trainingBlock") {
      await saveTrainingBlock(exercise, sessionId, db);
    }
  }
};

// Helper function to save a selected exercise
const saveSelectedExercise = async (
  exercise: SelectedExercise,
  sessionId: string,
  blockId: string | null,
  db: any
): Promise<void> => {
  const exerciseId = exercise.id || uuidv4();
  const now = new Date().toISOString();

  // Delete any existing selected exercise and its related data (hard delete to avoid UNIQUE constraint issues)
  // Only delete if the exercise ID already exists to avoid unnecessary operations
  const existingExercise = await db.select(
    "SELECT id FROM selected_exercises WHERE id = ?",
    [exerciseId]
  );
  if (existingExercise.length > 0) {
    await db.execute(
      "DELETE FROM progressions WHERE selected_exercise_id = ?",
      [exerciseId]
    );
    await db.execute(
      "DELETE FROM volume_reductions WHERE selected_exercise_id = ?",
      [exerciseId]
    );
    await db.execute(
      "DELETE FROM effort_reductions WHERE selected_exercise_id = ?",
      [exerciseId]
    );
    await db.execute("DELETE FROM selected_exercises WHERE id = ?", [
      exerciseId,
    ]);
  }

  // Insert selected exercise
  await db.execute(
    `INSERT INTO selected_exercises (id, session_id, exercise_id, block_id, series, repetitions, effort, rest_time, comments, created_at, last_changed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      exerciseId,
      sessionId,
      exercise.exerciseId,
      blockId,
      exercise.series,
      exercise.repetitions,
      exercise.effort,
      exercise.restTime,
      exercise.comments,
      now,
      now,
    ]
  );

  // Save progressions
  for (let i = 0; i < exercise.progression.length; i++) {
    const progression = exercise.progression[i];
    await db.execute(
      `INSERT INTO progressions (id, selected_exercise_id, series, repetitions, effort, week_number, created_at, last_changed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        exerciseId,
        progression.series,
        progression.repetitions,
        progression.effort,
        i + 1,
        now,
        now,
      ]
    );
  }

  // Save volume reductions
  if (exercise.reduceVolume) {
    for (const [fatigueLevel, percentage] of Object.entries(
      exercise.reduceVolume
    )) {
      await db.execute(
        `INSERT INTO volume_reductions (id, selected_exercise_id, fatigue_level, reduction_percentage, created_at, last_changed)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), exerciseId, fatigueLevel, percentage, now, now]
      );
    }
  }

  // Save effort reductions
  if (exercise.reduceEffort) {
    for (const [effortLevel, amount] of Object.entries(exercise.reduceEffort)) {
      await db.execute(
        `INSERT INTO effort_reductions (id, selected_exercise_id, effort_level, reduction_amount, created_at, last_changed)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), exerciseId, effortLevel, amount, now, now]
      );
    }
  }
};

// Helper function to save a training block
const saveTrainingBlock = async (
  block: TrainingBlock,
  sessionId: string,
  db: any
): Promise<void> => {
  const blockId = block.id || uuidv4();
  const now = new Date().toISOString();

  // Delete any existing training block and its related data (hard delete to avoid UNIQUE constraint issues)
  // Only delete if the block ID already exists to avoid unnecessary operations
  const existingBlock = await db.select(
    "SELECT id FROM training_blocks WHERE id = ?",
    [blockId]
  );
  if (existingBlock.length > 0) {
    await db.execute("DELETE FROM progressions WHERE training_block_id = ?", [
      blockId,
    ]);
    await db.execute(
      "DELETE FROM volume_reductions WHERE training_block_id = ?",
      [blockId]
    );
    await db.execute(
      "DELETE FROM effort_reductions WHERE training_block_id = ?",
      [blockId]
    );
    await db.execute("DELETE FROM selected_exercises WHERE block_id = ?", [
      blockId,
    ]);
    await db.execute("DELETE FROM training_blocks WHERE id = ?", [blockId]);
  }

  // Insert training block
  await db.execute(
    `INSERT INTO training_blocks (id, session_id, name, series, repetitions, effort, block_model, comments, rest_time, created_at, last_changed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      blockId,
      sessionId,
      block.name,
      block.series,
      block.repetitions,
      block.effort,
      block.blockModel,
      block.comments,
      block.restTime,
      now,
      now,
    ]
  );

  // Save progressions for block
  for (let i = 0; i < block.progression.length; i++) {
    const progression = block.progression[i];
    await db.execute(
      `INSERT INTO progressions (id, training_block_id, series, repetitions, effort, week_number, created_at, last_changed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        blockId,
        progression.series,
        progression.repetitions,
        progression.effort,
        i + 1,
        now,
        now,
      ]
    );
  }

  // Save volume reductions for block
  if (block.reduceVolume) {
    for (const [fatigueLevel, percentage] of Object.entries(
      block.reduceVolume
    )) {
      await db.execute(
        `INSERT INTO volume_reductions (id, training_block_id, fatigue_level, reduction_percentage, created_at, last_changed)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), blockId, fatigueLevel, percentage, now, now]
      );
    }
  }

  // Save effort reductions for block
  if (block.reduceEffort) {
    for (const [effortLevel, amount] of Object.entries(block.reduceEffort)) {
      await db.execute(
        `INSERT INTO effort_reductions (id, training_block_id, effort_level, reduction_amount, created_at, last_changed)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), blockId, effortLevel, amount, now, now]
      );
    }
  }

  // Save selected exercises within block
  for (const exercise of block.selectedExercises) {
    await saveSelectedExercise(exercise, sessionId, blockId, db);
  }
};

// Helper function to delete sessions for a plan
const deleteSessionsForPlan = async (
  planId: string,
  db: any
): Promise<void> => {
  const sessions = await db.select(
    "SELECT id FROM sessions WHERE plan_id = ? AND deleted_at IS NULL",
    [planId]
  );

  for (const session of sessions) {
    await deleteSession(session.id, db);
  }
};

// Helper function to delete a session
const deleteSession = async (sessionId: string, db: any): Promise<void> => {
  const now = new Date().toISOString();

  // Soft delete session days
  await db.execute(
    "UPDATE session_days SET deleted_at = ?, last_changed = ? WHERE session_id = ?",
    [now, now, sessionId]
  );

  // Get and delete training blocks
  const blocks = await db.select(
    "SELECT id FROM training_blocks WHERE session_id = ? AND deleted_at IS NULL",
    [sessionId]
  );

  for (const block of blocks) {
    await deleteTrainingBlock(block.id, db);
  }

  // Get and delete selected exercises
  const exercises = await db.select(
    "SELECT id FROM selected_exercises WHERE session_id = ? AND block_id IS NULL AND deleted_at IS NULL",
    [sessionId]
  );

  for (const exercise of exercises) {
    await deleteSelectedExercise(exercise.id, db);
  }

  // Soft delete session
  await db.execute(
    "UPDATE sessions SET deleted_at = ?, last_changed = ? WHERE id = ?",
    [now, now, sessionId]
  );
};

// Helper function to delete a training block
const deleteTrainingBlock = async (blockId: string, db: any): Promise<void> => {
  const now = new Date().toISOString();

  // Delete selected exercises in block
  const exercises = await db.select(
    "SELECT id FROM selected_exercises WHERE block_id = ? AND deleted_at IS NULL",
    [blockId]
  );

  for (const exercise of exercises) {
    await deleteSelectedExercise(exercise.id, db);
  }

  // Delete progressions
  await db.execute(
    "UPDATE progressions SET deleted_at = ?, last_changed = ? WHERE training_block_id = ?",
    [now, now, blockId]
  );

  // Delete volume reductions
  await db.execute(
    "UPDATE volume_reductions SET deleted_at = ?, last_changed = ? WHERE training_block_id = ?",
    [now, now, blockId]
  );

  // Delete effort reductions
  await db.execute(
    "UPDATE effort_reductions SET deleted_at = ?, last_changed = ? WHERE training_block_id = ?",
    [now, now, blockId]
  );

  // Soft delete training block
  await db.execute(
    "UPDATE training_blocks SET deleted_at = ?, last_changed = ? WHERE id = ?",
    [now, now, blockId]
  );
};

// Helper function to delete a selected exercise
const deleteSelectedExercise = async (
  exerciseId: string,
  db: any
): Promise<void> => {
  const now = new Date().toISOString();

  // Delete progressions
  await db.execute(
    "UPDATE progressions SET deleted_at = ?, last_changed = ? WHERE selected_exercise_id = ?",
    [now, now, exerciseId]
  );

  // Delete volume reductions
  await db.execute(
    "UPDATE volume_reductions SET deleted_at = ?, last_changed = ? WHERE selected_exercise_id = ?",
    [now, now, exerciseId]
  );

  // Delete effort reductions
  await db.execute(
    "UPDATE effort_reductions SET deleted_at = ?, last_changed = ? WHERE selected_exercise_id = ?",
    [now, now, exerciseId]
  );

  // Soft delete selected exercise
  await db.execute(
    "UPDATE selected_exercises SET deleted_at = ?, last_changed = ? WHERE id = ?",
    [now, now, exerciseId]
  );
};

// Delete a training plan
const deleteTrainingPlan = async (
  planId: string,
  externalDb?: any
): Promise<void> => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    // Delete all sessions for this plan
    await deleteSessionsForPlan(planId, dbToUse);

    // Soft delete the training plan
    const now = new Date().toISOString();
    await dbToUse.execute(
      "UPDATE training_plans SET deleted_at = ?, last_changed = ? WHERE id = ?",
      [now, now, planId]
    );

    if (isManagingTransaction) {
      await dbToUse.execute("COMMIT");
    }
  } catch (error) {
    if (isManagingTransaction) {
      console.error("Error during delete training plan, rolling back:", error);
      await dbToUse.execute("ROLLBACK");
    }
    throw error;
  }
};

// Get all training models
const getTrainingModels = async (
  isLoadingOperation: boolean = false
): Promise<TrainingModel[]> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    if (isLoadingOperation) {
      console.log(`📖 Loading training models (read-only operation)`);
    }

    // First, get all training models metadata
    const rawModels: any[] = await db.select(
      `SELECT tm.id, tm.name, tm.description, tm.training_plan_id, tm.created_at, tp.user_id
       FROM training_models tm 
       JOIN training_plans tp ON tm.training_plan_id = tp.id 
       WHERE tm.deleted_at IS NULL AND tp.deleted_at IS NULL 
       ORDER BY tm.created_at DESC`
    );

    const models: TrainingModel[] = [];

    // Group models by user_id to minimize database calls
    const userIds = Array.from(
      new Set(rawModels.map((model) => model.user_id))
    );
    const allPlansByUser = new Map<string, PlanState[]>();

    // Load all training plans for all users (without model loading to avoid circular dependency)
    for (const userId of userIds) {
      const plans = await getTrainingPlans(userId, true, isLoadingOperation); // Pass loading flag
      allPlansByUser.set(userId, plans);
    }

    // Now build the models by matching with their corresponding training plans
    for (const rawModel of rawModels) {
      const userPlans = allPlansByUser.get(rawModel.user_id) || [];
      const basePlan = userPlans.find(
        (plan) => plan.id === rawModel.training_plan_id
      );

      if (basePlan) {
        const model: TrainingModel = {
          ...basePlan,
          id: rawModel.id,
          name: rawModel.name,
          description: rawModel.description || "",
          trainingPlanId: rawModel.training_plan_id,
        };

        models.push(model);
      }
    }

    return models;
  } catch (error) {
    console.error("Error getting training models:", error);
    return [];
  }
};

// Save a training model
const saveTrainingModel = async (
  model: TrainingModel,
  userId: string
): Promise<void> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    await db.execute("BEGIN TRANSACTION");

    try {
      // Check if a training model already exists for this training plan
      const existingModel = await db.select(
        "SELECT id FROM training_models WHERE training_plan_id = ? AND deleted_at IS NULL",
        [model.id]
      );

      if (existingModel.length > 0) {
        // Use updateTrainingModel for existing models
        await updateTrainingModel(model, userId, db);
      } else {
        // First save the training plan (will create new or update existing)
        await saveTrainingPlan(model, userId, db);

        // Then create the model reference
        const modelId = uuidv4();
        const now = new Date().toISOString();
        await db.execute(
          `INSERT INTO training_models (id, name, description, training_plan_id, created_at, last_changed)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [modelId, model.name, model.description, model.id, now, now]
        );
      }

      await db.execute("COMMIT");
    } catch (innerError) {
      console.error("Error saving training model, rolling back:", innerError);
      await db.execute("ROLLBACK");
      throw innerError;
    }
  } catch (error) {
    console.error("Failed to save training model:", error);
    throw error;
  }
};

// Delete a training model
const deleteTrainingModel = async (modelId: string): Promise<void> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    await db.execute("BEGIN TRANSACTION");

    try {
      // Get the training plan ID associated with this model using the actual model ID
      const model = await db.select(
        "SELECT training_plan_id FROM training_models WHERE id = ? AND deleted_at IS NULL",
        [modelId]
      );

      if (model.length > 0) {
        // Delete the training plan
        await deleteTrainingPlan(model[0].training_plan_id, db);
      }

      // Soft delete the training model using the model ID
      const now = new Date().toISOString();
      await db.execute(
        "UPDATE training_models SET deleted_at = ?, last_changed = ? WHERE id = ?",
        [now, now, modelId]
      );

      await db.execute("COMMIT");
    } catch (innerError) {
      console.error("Error deleting training model, rolling back:", innerError);
      await db.execute("ROLLBACK");
      throw innerError;
    }
  } catch (error) {
    console.error("Failed to delete training model:", error);
    throw error;
  }
};

// Save an exercise
const saveExercise = async (exercise: Exercise): Promise<void> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    const exerciseId = exercise.id || uuidv4();
    const now = new Date().toISOString();

    // Check if exercise exists
    const existingExercise = await db.select(
      "SELECT id FROM exercises WHERE id = ?",
      [exerciseId]
    );

    if (existingExercise.length > 0) {
      // Update existing exercise
      await db.execute(
        `UPDATE exercises 
         SET name = ?, video_ref = ?, last_changed = ?
         WHERE id = ?`,
        [exercise.name, exercise.videoRef, now, exerciseId]
      );
    } else {
      // Insert new exercise
      await db.execute(
        `INSERT INTO exercises (id, name, video_ref, created_at, last_changed)
         VALUES (?, ?, ?, ?, ?)`,
        [exerciseId, exercise.name, exercise.videoRef, now, now]
      );
    }
  } catch (error) {
    console.error("Failed to save exercise:", error);
    throw error;
  }
};

// Get all training plans for a user with model references properly established
const getTrainingPlansWithModels = async (
  userId: string,
  isLoadingOperation: boolean = false
): Promise<PlanState[]> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    if (isLoadingOperation) {
      console.log(
        `📖 Loading training plans with models for user ${userId} (read-only operation)`
      );
    }

    // First load training plans without model loading to avoid circular dependency
    const plans = await getTrainingPlans(userId, true, isLoadingOperation);

    // Then load models
    const models = await getTrainingModels(isLoadingOperation);

    // Training plan to model relationships are now handled through junction table
    // No need to query model_id from training_plans since it no longer exists

    // Create set for efficient lookup of which plans ARE models
    const modelPlanIds = new Set(models.map((model) => model.id)); // Plans that ARE models

    // Update plans with correct model IDs
    // Note: Model relationships are now handled through the training_plan_models junction table
    // Plans no longer have direct modelId property

    return plans;
  } catch (error) {
    console.error("Error getting training plans with models:", error);
    return [];
  }
};

// Update an existing training plan
const updateTrainingPlan = async (
  planState: PlanState,
  userId: string,
  externalDb?: any
): Promise<void> => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    const now = new Date().toISOString();

    // Check if plan exists
    const existingPlan = await dbToUse.select(
      "SELECT id FROM training_plans WHERE id = ? AND deleted_at IS NULL",
      [planState.id]
    );

    if (existingPlan.length === 0) {
      throw new Error(`Training plan with ID ${planState.id} not found`);
    }

    // Update the training plan metadata
    await dbToUse.execute(
      `UPDATE training_plans 
       SET n_of_weeks = ?, n_of_sessions = ?, last_changed = ?
       WHERE id = ?`,
      [planState.nOfWeeks, planState.nOfSessions, now, planState.id]
    );

    // Delete existing sessions and related data, then recreate
    await deleteSessionsForPlan(planState.id, dbToUse);

    // Save new sessions
    for (const session of planState.sessions) {
      await saveSession(session, planState.id, dbToUse);
    }

    if (isManagingTransaction) {
      await dbToUse.execute("COMMIT");
    }
  } catch (error) {
    if (isManagingTransaction) {
      console.error("Error updating training plan, rolling back:", error);
      await dbToUse.execute("ROLLBACK");
    }
    throw error;
  }
};

// Update an existing training model
const updateTrainingModel = async (
  model: TrainingModel,
  userId: string,
  externalDb?: any
): Promise<void> => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    const now = new Date().toISOString();

    // Find the existing training model by training plan ID
    const existingModel = await dbToUse.select(
      "SELECT id FROM training_models WHERE training_plan_id = ? AND deleted_at IS NULL",
      [model.id]
    );

    if (existingModel.length === 0) {
      throw new Error(`Training model for plan ID ${model.id} not found`);
    }

    // Update the training model metadata
    await dbToUse.execute(
      `UPDATE training_models 
       SET name = ?, description = ?, last_changed = ?
       WHERE training_plan_id = ?`,
      [model.name, model.description, now, model.id]
    );

    // Update the underlying training plan
    await updateTrainingPlan(model, userId, dbToUse);

    if (isManagingTransaction) {
      await dbToUse.execute("COMMIT");
    }
  } catch (error) {
    if (isManagingTransaction) {
      console.error("Error updating training model, rolling back:", error);
      await dbToUse.execute("ROLLBACK");
    }
    throw error;
  }
};

// Update only training plan metadata (without touching sessions)
const updateTrainingPlanMetadata = async (
  planId: string,
  updates: Partial<{
    nOfWeeks: number;
    nOfSessions: number;
  }>,
  externalDb?: any
): Promise<void> => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));

  try {
    const now = new Date().toISOString();
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    // Build dynamic update query based on provided fields
    if (updates.nOfWeeks !== undefined) {
      updateFields.push("n_of_weeks = ?");
      updateValues.push(updates.nOfWeeks);
    }
    if (updates.nOfSessions !== undefined) {
      updateFields.push("n_of_sessions = ?");
      updateValues.push(updates.nOfSessions);
    }

    if (updateFields.length === 0) {
      return; // Nothing to update
    }

    updateFields.push("last_changed = ?");
    updateValues.push(now);
    updateValues.push(planId);

    const query = `UPDATE training_plans SET ${updateFields.join(
      ", "
    )} WHERE id = ?`;
    await dbToUse.execute(query, updateValues);
  } catch (error) {
    console.error("Error updating training plan metadata:", error);
    throw error;
  }
};

// Update only training model metadata (without touching the training plan)
const updateTrainingModelMetadata = async (
  trainingPlanId: string,
  updates: Partial<{
    name: string;
    description: string;
  }>,
  externalDb?: any
): Promise<void> => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));

  try {
    const now = new Date().toISOString();
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    // Build dynamic update query based on provided fields
    if (updates.name !== undefined) {
      updateFields.push("name = ?");
      updateValues.push(updates.name);
    }
    if (updates.description !== undefined) {
      updateFields.push("description = ?");
      updateValues.push(updates.description);
    }

    if (updateFields.length === 0) {
      return; // Nothing to update
    }

    updateFields.push("last_changed = ?");
    updateValues.push(now);
    updateValues.push(trainingPlanId);

    const query = `UPDATE training_models SET ${updateFields.join(
      ", "
    )} WHERE training_plan_id = ?`;
    await dbToUse.execute(query, updateValues);
  } catch (error) {
    console.error("Error updating training model metadata:", error);
    throw error;
  }
};

// Update a specific session within a training plan
const updateSession = async (
  session: Session,
  externalDb?: any
): Promise<void> => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    const now = new Date().toISOString();

    // Check if session exists
    const existingSession = await dbToUse.select(
      "SELECT id FROM sessions WHERE id = ? AND deleted_at IS NULL",
      [session.id]
    );

    if (existingSession.length === 0) {
      throw new Error(`Session with ID ${session.id} not found`);
    }

    // Update session metadata
    await dbToUse.execute(
      `UPDATE sessions SET name = ?, last_changed = ? WHERE id = ?`,
      [session.name, now, session.id]
    );

    // Delete existing session days and related data, then recreate
    await deleteSessionExercisesAndDays(session.id, dbToUse);

    // Recreate session days
    for (const day of session.days) {
      await dbToUse.execute(
        `INSERT INTO session_days (id, session_id, day_name, created_at, last_changed) VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), session.id, day, now, now]
      );
    }

    // Recreate exercises and blocks
    for (const exercise of session.exercises) {
      if (exercise.type === "selectedExercise") {
        await saveSelectedExercise(exercise, session.id, null, dbToUse);
      } else if (exercise.type === "trainingBlock") {
        await saveTrainingBlock(exercise, session.id, dbToUse);
      }
    }

    if (isManagingTransaction) {
      await dbToUse.execute("COMMIT");
    }
  } catch (error) {
    if (isManagingTransaction) {
      console.error("Error updating session, rolling back:", error);
      await dbToUse.execute("ROLLBACK");
    }
    throw error;
  }
};

// Helper function to delete session exercises and days (but keep the session)
const deleteSessionExercisesAndDays = async (
  sessionId: string,
  db: any
): Promise<void> => {
  const now = new Date().toISOString();

  // Soft delete session days
  await db.execute(
    "UPDATE session_days SET deleted_at = ?, last_changed = ? WHERE session_id = ?",
    [now, now, sessionId]
  );

  // Get and delete training blocks
  const blocks = await db.select(
    "SELECT id FROM training_blocks WHERE session_id = ? AND deleted_at IS NULL",
    [sessionId]
  );

  for (const block of blocks) {
    await deleteTrainingBlock(block.id, db);
  }

  // Get and delete selected exercises (not in blocks)
  const exercises = await db.select(
    "SELECT id FROM selected_exercises WHERE session_id = ? AND block_id IS NULL AND deleted_at IS NULL",
    [sessionId]
  );

  for (const exercise of exercises) {
    await deleteSelectedExercise(exercise.id, db);
  }
};

// Update a specific selected exercise
const updateSelectedExercise = async (
  exercise: SelectedExercise,
  externalDb?: any
): Promise<void> => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    const now = new Date().toISOString();

    // Check if exercise exists
    const existingExercise = await dbToUse.select(
      "SELECT id FROM selected_exercises WHERE id = ? AND deleted_at IS NULL",
      [exercise.id]
    );

    if (existingExercise.length === 0) {
      throw new Error(`Selected exercise with ID ${exercise.id} not found`);
    }

    // Update selected exercise
    await dbToUse.execute(
      `UPDATE selected_exercises 
       SET exercise_id = ?, series = ?, repetitions = ?, effort = ?, rest_time = ?, comments = ?, last_changed = ?
       WHERE id = ?`,
      [
        exercise.exerciseId,
        exercise.series,
        exercise.repetitions,
        exercise.effort,
        exercise.restTime,
        exercise.comments,
        now,
        exercise.id,
      ]
    );

    // Delete existing progressions, volume reductions, and effort reductions
    await deleteSelectedExerciseData(exercise.id, dbToUse);

    // Recreate progressions
    for (let i = 0; i < exercise.progression.length; i++) {
      const progression = exercise.progression[i];
      await dbToUse.execute(
        `INSERT INTO progressions (id, selected_exercise_id, series, repetitions, effort, week_number, created_at, last_changed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          exercise.id,
          progression.series,
          progression.repetitions,
          progression.effort,
          i + 1,
          now,
          now,
        ]
      );
    }

    // Recreate volume reductions
    if (exercise.reduceVolume) {
      for (const [fatigueLevel, percentage] of Object.entries(
        exercise.reduceVolume
      )) {
        await dbToUse.execute(
          `INSERT INTO volume_reductions (id, selected_exercise_id, fatigue_level, reduction_percentage, created_at, last_changed)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), exercise.id, fatigueLevel, percentage, now, now]
        );
      }
    }

    // Recreate effort reductions
    if (exercise.reduceEffort) {
      for (const [effortLevel, amount] of Object.entries(
        exercise.reduceEffort
      )) {
        await dbToUse.execute(
          `INSERT INTO effort_reductions (id, selected_exercise_id, effort_level, reduction_amount, created_at, last_changed)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), exercise.id, effortLevel, amount, now, now]
        );
      }
    }

    if (isManagingTransaction) {
      await dbToUse.execute("COMMIT");
    }
  } catch (error) {
    if (isManagingTransaction) {
      console.error("Error updating selected exercise, rolling back:", error);
      await dbToUse.execute("ROLLBACK");
    }
    throw error;
  }
};

// Update a specific training block
const updateTrainingBlock = async (
  block: TrainingBlock,
  externalDb?: any
): Promise<void> => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    const now = new Date().toISOString();

    // Check if block exists
    const existingBlock = await dbToUse.select(
      "SELECT id FROM training_blocks WHERE id = ? AND deleted_at IS NULL",
      [block.id]
    );

    if (existingBlock.length === 0) {
      throw new Error(`Training block with ID ${block.id} not found`);
    }

    // Update training block
    await dbToUse.execute(
      `UPDATE training_blocks 
       SET name = ?, series = ?, repetitions = ?, effort = ?, block_model = ?, comments = ?, rest_time = ?, last_changed = ?
       WHERE id = ?`,
      [
        block.name,
        block.series,
        block.repetitions,
        block.effort,
        block.blockModel,
        block.comments,
        block.restTime,
        now,
        block.id,
      ]
    );

    // Delete existing block data
    await deleteTrainingBlockData(block.id, dbToUse);

    // Recreate progressions for block
    for (let i = 0; i < block.progression.length; i++) {
      const progression = block.progression[i];
      await dbToUse.execute(
        `INSERT INTO progressions (id, training_block_id, series, repetitions, effort, week_number, created_at, last_changed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          block.id,
          progression.series,
          progression.repetitions,
          progression.effort,
          i + 1,
          now,
          now,
        ]
      );
    }

    // Recreate volume reductions for block
    if (block.reduceVolume) {
      for (const [fatigueLevel, percentage] of Object.entries(
        block.reduceVolume
      )) {
        await dbToUse.execute(
          `INSERT INTO volume_reductions (id, training_block_id, fatigue_level, reduction_percentage, created_at, last_changed)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), block.id, fatigueLevel, percentage, now, now]
        );
      }
    }

    // Recreate effort reductions for block
    if (block.reduceEffort) {
      for (const [effortLevel, amount] of Object.entries(block.reduceEffort)) {
        await dbToUse.execute(
          `INSERT INTO effort_reductions (id, training_block_id, effort_level, reduction_amount, created_at, last_changed)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), block.id, effortLevel, amount, now, now]
        );
      }
    }

    // Recreate selected exercises within block
    for (const exercise of block.selectedExercises) {
      await saveSelectedExercise(exercise, block.sessionId, block.id, dbToUse);
    }

    if (isManagingTransaction) {
      await dbToUse.execute("COMMIT");
    }
  } catch (error) {
    if (isManagingTransaction) {
      console.error("Error updating training block, rolling back:", error);
      await dbToUse.execute("ROLLBACK");
    }
    throw error;
  }
};

// Helper function to delete selected exercise data (progressions, reductions) without deleting the exercise itself
const deleteSelectedExerciseData = async (
  exerciseId: string,
  db: any
): Promise<void> => {
  const now = new Date().toISOString();

  // Delete progressions
  await db.execute(
    "UPDATE progressions SET deleted_at = ?, last_changed = ? WHERE selected_exercise_id = ?",
    [now, now, exerciseId]
  );

  // Delete volume reductions
  await db.execute(
    "UPDATE volume_reductions SET deleted_at = ?, last_changed = ? WHERE selected_exercise_id = ?",
    [now, now, exerciseId]
  );

  // Delete effort reductions
  await db.execute(
    "UPDATE effort_reductions SET deleted_at = ?, last_changed = ? WHERE selected_exercise_id = ?",
    [now, now, exerciseId]
  );
};

// Helper function to delete training block data (progressions, reductions, exercises) without deleting the block itself
const deleteTrainingBlockData = async (
  blockId: string,
  db: any
): Promise<void> => {
  const now = new Date().toISOString();

  // Delete selected exercises in block
  const exercises = await db.select(
    "SELECT id FROM selected_exercises WHERE block_id = ? AND deleted_at IS NULL",
    [blockId]
  );

  for (const exercise of exercises) {
    await deleteSelectedExercise(exercise.id, db);
  }

  // Delete progressions
  await db.execute(
    "UPDATE progressions SET deleted_at = ?, last_changed = ? WHERE training_block_id = ?",
    [now, now, blockId]
  );

  // Delete volume reductions
  await db.execute(
    "UPDATE volume_reductions SET deleted_at = ?, last_changed = ? WHERE training_block_id = ?",
    [now, now, blockId]
  );

  // Delete effort reductions
  await db.execute(
    "UPDATE effort_reductions SET deleted_at = ?, last_changed = ? WHERE training_block_id = ?",
    [now, now, blockId]
  );
};

// Update an existing exercise
const updateExercise = async (exercise: Exercise): Promise<void> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    // Check if exercise exists
    const existingExercise = await db.select(
      "SELECT id FROM exercises WHERE id = ? AND deleted_at IS NULL",
      [exercise.id]
    );

    if (existingExercise.length === 0) {
      throw new Error(`Exercise with ID ${exercise.id} not found`);
    }

    const now = new Date().toISOString();

    // Update existing exercise
    await db.execute(
      `UPDATE exercises 
       SET name = ?, video_ref = ?, last_changed = ?
       WHERE id = ?`,
      [exercise.name, exercise.videoRef, now, exercise.id]
    );
  } catch (error) {
    console.error("Failed to update exercise:", error);
    throw error;
  }
};

// Delete an exercise
const deleteExercise = async (exerciseId: string): Promise<void> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    const now = new Date().toISOString();
    await db.execute(
      "UPDATE exercises SET deleted_at = ?, last_changed = ? WHERE id = ?",
      [now, now, exerciseId]
    );
  } catch (error) {
    console.error("Failed to delete exercise:", error);
    throw error;
  }
};

export {
  getTrainingPlans,
  getTrainingPlansWithModels,
  saveTrainingPlan,
  updateTrainingPlan,
  updateTrainingPlanMetadata,
  deleteTrainingPlan,
  getTrainingModels,
  saveTrainingModel,
  updateTrainingModel,
  updateTrainingModelMetadata,
  deleteTrainingModel,
  getExercises,
  saveExercise,
  updateExercise,
  deleteExercise,
  updateSession,
  updateSelectedExercise,
  updateTrainingBlock,
};

export default getTrainingPlansWithModels;
