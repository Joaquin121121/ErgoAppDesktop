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
  RawProgression,
  RawVolumeReduction,
  RawEffortReduction,
  RawExercise,
} from "../types/trainingPlan";

const getTrainingPlans = async (
  coachId: string,
  externalDb?: any
): Promise<PlanState[]> => {
  try {
    const db =
      externalDb || (await (Database as any).load("sqlite:ergolab.db"));

    const rawPlans = await db.select(
      "SELECT * FROM training_plans WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC",
      [coachId]
    );

    const plans: PlanState[] = [];

    for (const rawPlan of rawPlans) {
      const rawSessions = await db.select(
        "SELECT * FROM sessions WHERE plan_id = ? AND deleted_at IS NULL ORDER BY created_at ASC",
        [rawPlan.id]
      );

      const sessions: Session[] = [];

      for (const rawSession of rawSessions) {
        const rawSessionDays = await db.select(
          "SELECT * FROM session_days WHERE session_id = ? AND deleted_at IS NULL ORDER BY created_at ASC",
          [rawSession.id]
        );

        const days = rawSessionDays.map((day) => day.day_name);

        const exercises: (SelectedExercise | TrainingBlock)[] = [];

        const rawBlocks = await db.select(
          "SELECT * FROM training_blocks WHERE session_id = ? AND deleted_at IS NULL ORDER BY created_at ASC",
          [rawSession.id]
        );

        for (const rawBlock of rawBlocks) {
          const blockProgressions = await getProgressions(
            null,
            rawBlock.id,
            db
          );

          const blockVolumeReductions = await getVolumeReductions(
            null,
            rawBlock.id,
            db
          );

          const blockEffortReductions = await getEffortReductions(
            null,
            rawBlock.id,
            db
          );

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
            blockModel: rawBlock.block_model,
            progression: blockProgressions,
            comments: rawBlock.comments || "",
            restTime: rawBlock.rest_time,
            reduceVolume: blockVolumeReductions,
            reduceEffort: blockEffortReductions,
          };

          exercises.push(trainingBlock);
        }

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

const addTrainingPlan = async (
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

    const planId = planState.id || uuidv4();
    const now = new Date().toISOString();
    await dbToUse.execute(
      `INSERT INTO training_plans (id, n_of_weeks, n_of_sessions, user_id, created_at, last_changed)
        VALUES (?, ?, ?, ?, ?, ?)`,
      [planId, planState.nOfWeeks, planState.nOfSessions, userId, now, now]
    );
    for (const session of planState.sessions) {
      await addSession(session, planId, dbToUse);
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

const addSession = async (
  session: Session,
  planId: string,
  db: any
): Promise<void> => {
  const sessionId = session.id || uuidv4();
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO sessions (id, plan_id, name, created_at, last_changed) VALUES (?, ?, ?, ?, ?)`,
    [sessionId, planId, session.name, now, now]
  );

  for (const day of session.days) {
    await db.execute(
      `INSERT INTO session_days (id, session_id, day_name, created_at, last_changed) VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), sessionId, day, now, now]
    );
  }

  for (const exercise of session.exercises) {
    if (exercise.type === "selectedExercise") {
      await addSelectedExercise(exercise, sessionId, null, db);
    } else if (exercise.type === "trainingBlock") {
      await addTrainingBlock(exercise, sessionId, db);
    }
  }
};

const addSelectedExercise = async (
  exercise: SelectedExercise,
  sessionId: string,
  blockId: string | null,
  db: any
): Promise<void> => {
  const exerciseId = exercise.id || uuidv4();
  const now = new Date().toISOString();

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

const addTrainingBlock = async (
  block: TrainingBlock,
  sessionId: string,
  db: any
): Promise<void> => {
  const blockId = block.id || uuidv4();
  const now = new Date().toISOString();

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

  if (block.reduceEffort) {
    for (const [effortLevel, amount] of Object.entries(block.reduceEffort)) {
      await db.execute(
        `INSERT INTO effort_reductions (id, training_block_id, effort_level, reduction_amount, created_at, last_changed)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), blockId, effortLevel, amount, now, now]
      );
    }
  }

  for (const exercise of block.selectedExercises) {
    await addSelectedExercise(exercise, sessionId, blockId, db);
  }
};

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

  await db.execute(
    "UPDATE sessions SET deleted_at = ?, last_changed = ? WHERE id = ?",
    [now, now, sessionId]
  );
};

// Helper function to delete a training block
const deleteTrainingBlock = async (blockId: string, db: any): Promise<void> => {
  const now = new Date().toISOString();

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

  await db.execute(
    "UPDATE selected_exercises SET deleted_at = ?, last_changed = ? WHERE id = ?",
    [now, now, exerciseId]
  );
};

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

const getTrainingModels = async (): Promise<TrainingModel[]> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

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

    for (const userId of userIds) {
      const plans = await getTrainingPlans(userId, db);
      allPlansByUser.set(userId, plans);
    }

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

const addTrainingModel = async (
  model: TrainingModel,
  userId: string
): Promise<void> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    await db.execute("BEGIN TRANSACTION");

    try {
      await addTrainingPlan(model, userId, db);

      const modelId = uuidv4();
      const now = new Date().toISOString();
      await db.execute(
        `INSERT INTO training_models (id, name, description, training_plan_id, created_at, last_changed)
           VALUES (?, ?, ?, ?, ?, ?)`,
        [modelId, model.name, model.description, model.id, now, now]
      );

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

const deleteTrainingModel = async (modelId: string): Promise<void> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    await db.execute("BEGIN TRANSACTION");

    try {
      const model = await db.select(
        "SELECT training_plan_id FROM training_models WHERE id = ? AND deleted_at IS NULL",
        [modelId]
      );

      if (model.length > 0) {
        await deleteTrainingPlan(model[0].training_plan_id, db);
      }

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

const addExercise = async (exercise: Exercise): Promise<void> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    const exerciseId = exercise.id || uuidv4();
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO exercises (id, name, video_ref, created_at, last_changed)
         VALUES (?, ?, ?, ?, ?)`,
      [exerciseId, exercise.name, exercise.videoRef, now, now]
    );
  } catch (error) {
    console.error("Failed to save exercise:", error);
    throw error;
  }
};

const updateTrainingPlan = async (planState: PlanState): Promise<void> => {
  const db = await (Database as any).load("sqlite:ergolab.db");

  try {
    await db.execute("BEGIN TRANSACTION");

    const now = new Date().toISOString();

    const existingPlan = await db.select(
      "SELECT id FROM training_plans WHERE id = ? AND deleted_at IS NULL",
      [planState.id]
    );

    if (existingPlan.length === 0) {
      throw new Error(`Training plan with ID ${planState.id} not found`);
    }

    await db.execute(
      `UPDATE training_plans 
       SET n_of_weeks = ?, n_of_sessions = ?, last_changed = ?
       WHERE id = ?`,
      [planState.nOfWeeks, planState.nOfSessions, now, planState.id]
    );

    await db.execute("COMMIT");
  } catch (error) {
    console.error("Error updating training plan, rolling back:", error);
    await db.execute("ROLLBACK");
    throw error;
  }
};

const updateTrainingModel = async (model: TrainingModel): Promise<void> => {
  const db = await (Database as any).load("sqlite:ergolab.db");

  try {
    await db.execute("BEGIN TRANSACTION");

    const now = new Date().toISOString();

    const existingModel = await db.select(
      "SELECT id FROM training_models WHERE training_plan_id = ? AND deleted_at IS NULL",
      [model.id]
    );

    if (existingModel.length === 0) {
      throw new Error(`Training model for plan ID ${model.id} not found`);
    }

    await db.execute(
      `UPDATE training_models 
       SET name = ?, description = ?, last_changed = ?
       WHERE training_plan_id = ?`,
      [model.name, model.description, now, model.id]
    );
  } catch (error) {
    console.error("Error updating training model:", error);
    throw error;
  }
};

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

    const existingSession = await dbToUse.select(
      "SELECT id FROM sessions WHERE id = ? AND deleted_at IS NULL",
      [session.id]
    );

    if (existingSession.length === 0) {
      throw new Error(`Session with ID ${session.id} not found`);
    }

    await dbToUse.execute(
      `UPDATE sessions SET name = ?, last_changed = ? WHERE id = ?`,
      [session.name, now, session.id]
    );

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

    const existingExercise = await dbToUse.select(
      "SELECT id FROM selected_exercises WHERE id = ? AND deleted_at IS NULL",
      [exercise.id]
    );

    if (existingExercise.length === 0) {
      throw new Error(`Selected exercise with ID ${exercise.id} not found`);
    }

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

    const existingBlock = await dbToUse.select(
      "SELECT id FROM training_blocks WHERE id = ? AND deleted_at IS NULL",
      [block.id]
    );

    if (existingBlock.length === 0) {
      throw new Error(`Training block with ID ${block.id} not found`);
    }

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
  } catch (error) {
    console.error("Error updating training block:", error);
    throw error;
  }
};

const updateExercise = async (exercise: Exercise): Promise<void> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    const existingExercise = await db.select(
      "SELECT id FROM exercises WHERE id = ? AND deleted_at IS NULL",
      [exercise.id]
    );

    if (existingExercise.length === 0) {
      throw new Error(`Exercise with ID ${exercise.id} not found`);
    }

    const now = new Date().toISOString();

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

const updateProgression = async (
  progression: Progression,
  selectedExerciseId: string,
  index: number
): Promise<void> => {
  const db = await (Database as any).load("sqlite:ergolab.db");
  const now = new Date().toISOString();

  const progressionId = await db.select(
    "SELECT id FROM progressions WHERE selected_exercise_id = ? AND week_number = ? AND deleted_at IS NULL",
    [selectedExerciseId, index]
  );

  if (progressionId.length === 0) {
    throw new Error(
      `Progression with selected exercise ID ${selectedExerciseId} and week number ${index} not found`
    );
  }

  await db.execute(
    "UPDATE progressions SET series = ?, repetitions = ?, effort = ?, last_changed = ? WHERE id = ?",
    [
      progression.series,
      progression.repetitions,
      progression.effort,
      now,
      progressionId,
    ]
  );
};

export {
  getTrainingPlans,
  addTrainingPlan,
  addSession,
  addSelectedExercise,
  addTrainingBlock,
  deleteTrainingPlan,
  deleteSession,
  deleteTrainingBlock,
  deleteSelectedExercise,
  getTrainingModels,
  addTrainingModel,
  deleteTrainingModel,
  addExercise,
  updateTrainingPlan,
  updateTrainingModel,
  updateSession,
  updateSelectedExercise,
  updateTrainingBlock,
  updateExercise,
  deleteExercise,
};
