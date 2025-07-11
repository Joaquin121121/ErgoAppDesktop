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
import { PendingRecord } from "../types/Sync";

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
        athleteId: rawPlan.athlete_id,
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
  try {
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
    const progressions: Progression[] = [];
    rawProgressions.forEach((prog: RawProgression) => {
      progressions.push({
        id: prog.id,
        series: prog.series,
        repetitions: prog.repetitions,
        effort: prog.effort,
      });
    });
    return progressions;
  } catch (error) {
    console.error("Error getting progressions:", error);
    return [];
  }
};

const getVolumeReductions = async (
  selectedExerciseId: string | null,
  trainingBlockId: string | null,
  db: any
): Promise<VolumeReduction> => {
  try {
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
      return {
        id: "",
      };
    }

    const rawReductions = await db.select(query, params);
    const reductions: VolumeReduction = {
      id: "",
    };

    rawReductions.forEach((reduction: RawVolumeReduction) => {
      reductions[reduction.fatigue_level] = reduction.reduction_percentage;
    });

    return reductions;
  } catch (error) {
    console.error("Error getting volume reductions:", error);
    return {
      id: "",
    };
  }
};

const getEffortReductions = async (
  selectedExerciseId: string | null,
  trainingBlockId: string | null,
  db: any
): Promise<EffortReduction> => {
  try {
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
      return {
        id: "",
      };
    }

    const rawReductions = await db.select(query, params);
    const reductions: EffortReduction = {
      id: "",
    };

    rawReductions.forEach((reduction: RawEffortReduction) => {
      reductions[reduction.effort_level] = reduction.reduction_amount;
      reductions.id = reduction.id;
    });

    return reductions;
  } catch (error) {
    console.error("Error getting effort reductions:", error);
    return {
      id: "",
    };
  }
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
  pushRecord: (records: PendingRecord[]) => Promise<void>,
  externalDb?: any
): Promise<PendingRecord[]> => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    const recordsToSync: PendingRecord[] = [];
    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    const planId = planState.id || uuidv4();
    await dbToUse.execute(
      `INSERT INTO training_plans (id, n_of_weeks, n_of_sessions, user_id, athlete_id, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [
        planId,
        planState.nOfWeeks,
        planState.nOfSessions,
        userId,
        planState.athleteId || null,
      ]
    );
    recordsToSync.push({ tableName: "training_plans", id: planId });
    for (const session of planState.sessions) {
      const sessionRecords = await addSession(
        session,
        planId,
        pushRecord,
        dbToUse
      );
      recordsToSync.push(...sessionRecords);
    }

    if (isManagingTransaction) {
      await dbToUse.execute("COMMIT");
      await pushRecord(recordsToSync);
    } else {
      return recordsToSync;
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
  pushRecord: (records: PendingRecord[]) => Promise<void>,
  externalDb?: any
): Promise<PendingRecord[]> => {
  try {
    const db =
      externalDb || (await (Database as any).load("sqlite:ergolab.db"));
    const recordsToSync: PendingRecord[] = [];

    const sessionId = session.id || uuidv4();

    await db.execute(
      `INSERT INTO sessions (id, plan_id, name, created_at) VALUES (?, ?, ?, datetime('now'))`,
      [sessionId, planId, session.name]
    );
    recordsToSync.push({ tableName: "sessions", id: sessionId });

    for (const day of session.days) {
      const dayId = uuidv4();
      await db.execute(
        `INSERT INTO session_days (id, session_id, day_name, created_at) VALUES (?, ?, ?, datetime('now'))`,
        [dayId, sessionId, day]
      );
      recordsToSync.push({ tableName: "session_days", id: dayId });
    }
    for (const exercise of session.exercises) {
      if (exercise.type === "selectedExercise") {
        const result = await addSelectedExercise(
          exercise,
          sessionId,
          null,
          pushRecord,
          db
        );
        if (Array.isArray(result)) {
          recordsToSync.push(...result);
        }
      } else if (exercise.type === "trainingBlock") {
        const result = await addTrainingBlock(
          exercise,
          sessionId,
          pushRecord,
          db
        );
        if (Array.isArray(result)) {
          recordsToSync.push(...result);
        }
      }
    }
    if (externalDb) {
      return recordsToSync;
    }
    await pushRecord(recordsToSync);
  } catch (error) {
    console.error("Error adding session:", error);
    throw error;
  }
};

const addSelectedExercise = async (
  exercise: SelectedExercise,
  sessionId: string,
  blockId: string | null,
  pushRecord: (records: PendingRecord[]) => Promise<void>,
  externalDb?: any
): Promise<string | PendingRecord[]> => {
  try {
    const recordsToSync: PendingRecord[] = [];
    const exerciseId = exercise.id || uuidv4();

    const db =
      externalDb || (await (Database as any).load("sqlite:ergolab.db"));

    await db.execute(
      `INSERT INTO selected_exercises (id, session_id, exercise_id, block_id, series, repetitions, effort, rest_time, comments, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
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
      ]
    );
    recordsToSync.push({ tableName: "selected_exercises", id: exerciseId });

    for (let i = 0; i < exercise.progression.length; i++) {
      const progression = exercise.progression[i];
      const progressionId = uuidv4();
      await db.execute(
        `INSERT INTO progressions (id, selected_exercise_id, series, repetitions, effort, week_number, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          progressionId,
          exerciseId,
          progression.series,
          progression.repetitions,
          progression.effort,
          i + 1,
        ]
      );
      recordsToSync.push({ tableName: "progressions", id: progressionId });
    }

    if (exercise.reduceVolume) {
      delete exercise.reduceVolume.id;
      console.log("exercise.reduceVolume", exercise.reduceVolume);
      for (const [fatigueLevel, percentage] of Object.entries(
        exercise.reduceVolume
      )) {
        const volumeReductionId = uuidv4();
        await db.execute(
          `INSERT INTO volume_reductions (id, selected_exercise_id, fatigue_level, reduction_percentage, created_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
          [volumeReductionId, exerciseId, fatigueLevel, percentage]
        );
        recordsToSync.push({
          tableName: "volume_reductions",
          id: volumeReductionId,
        });
      }
    }

    if (
      exercise.reduceEffort &&
      exercise.reduceEffort.id &&
      exercise.reduceEffort.id.length > 0
    ) {
      delete exercise.reduceEffort.id;
      for (const [effortLevel, amount] of Object.entries(
        exercise.reduceEffort
      )) {
        const effortReductionId = uuidv4();
        await db.execute(
          `INSERT INTO effort_reductions (id, selected_exercise_id, effort_level, reduction_amount, created_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
          [effortReductionId, exerciseId, effortLevel, amount]
        );
        recordsToSync.push({
          tableName: "effort_reductions",
          id: effortReductionId,
        });
      }
    }
    if (externalDb) {
      return recordsToSync;
    }
    await pushRecord(recordsToSync);
    return exerciseId;
  } catch (error) {
    console.error("Error adding selected exercise:", error);
    throw error;
  }
};

const addTrainingBlock = async (
  block: TrainingBlock,
  sessionId: string,
  pushRecord: (records: PendingRecord[]) => Promise<void>,
  externalDb?: any
): Promise<PendingRecord[]> => {
  try {
    const db =
      externalDb || (await (Database as any).load("sqlite:ergolab.db"));
    const recordsToSync: PendingRecord[] = [];
    const blockId = block.id || uuidv4();

    await db.execute(
      `INSERT INTO training_blocks (id, session_id, name, series, repetitions, effort, block_model, comments, rest_time, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
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
      ]
    );
    recordsToSync.push({ tableName: "training_blocks", id: blockId });

    for (let i = 0; i < block.progression.length; i++) {
      const progression = block.progression[i];
      const progressionId = uuidv4();
      await db.execute(
        `INSERT INTO progressions (id, training_block_id, series, repetitions, effort, week_number, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          progressionId,
          blockId,
          progression.series,
          progression.repetitions,
          progression.effort,
          i + 1,
        ]
      );
      recordsToSync.push({ tableName: "progressions", id: progressionId });
    }

    if (block.reduceVolume) {
      console.log("block.reduceVolume", block.reduceVolume);
      delete block.reduceVolume.id;
      for (const [fatigueLevel, percentage] of Object.entries(
        block.reduceVolume
      )) {
        const volumeReductionId = uuidv4();
        await db.execute(
          `INSERT INTO volume_reductions (id, training_block_id, fatigue_level, reduction_percentage, created_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
          [volumeReductionId, blockId, fatigueLevel, percentage]
        );
        recordsToSync.push({
          tableName: "volume_reductions",
          id: volumeReductionId,
        });
      }
    }

    if (block.reduceEffort) {
      delete block.reduceEffort.id;
      for (const [effortLevel, amount] of Object.entries(block.reduceEffort)) {
        const effortReductionId = uuidv4();
        await db.execute(
          `INSERT INTO effort_reductions (id, training_block_id, effort_level, reduction_amount, created_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
          [effortReductionId, blockId, effortLevel, amount]
        );
        recordsToSync.push({
          tableName: "effort_reductions",
          id: effortReductionId,
        });
      }
    }

    for (const exercise of block.selectedExercises) {
      const result = await addSelectedExercise(
        exercise,
        sessionId,
        blockId,
        pushRecord,
        db
      );
      if (Array.isArray(result)) {
        recordsToSync.push(...result);
      }
    }
    if (externalDb) {
      return recordsToSync;
    }
    await pushRecord(recordsToSync);
  } catch (error) {
    console.error("Error adding training block:", error);
    throw error;
  }
};

const moveExerciseToIndex = async (
  exerciseId: string,
  newIndex: number,
  sessionId: string,
  type: "session" | "block",
  pushRecord: (records: PendingRecord[]) => Promise<void>
): Promise<void> => {
  const db = await (Database as any).load("sqlite:ergolab.db");

  try {
    // Determine if we're moving a selected exercise or a training block
    let currentIndex: number;
    let isTrainingBlock = false;
    let tableName: "selected_exercises" | "training_blocks";

    // First check if it's a selected exercise
    const exerciseData = await db.select(
      'SELECT "index" FROM selected_exercises WHERE id = ? AND block_id IS NULL',
      [exerciseId]
    );

    if (exerciseData.length > 0) {
      currentIndex = exerciseData[0].index;
      tableName = "selected_exercises";
    } else {
      // Check if it's a training block
      const blockData = await db.select(
        'SELECT "index" FROM training_blocks WHERE id = ?',
        [exerciseId]
      );

      if (blockData.length > 0) {
        currentIndex = blockData[0].index;
        tableName = "training_blocks";
        isTrainingBlock = true;
      } else {
        throw new Error("Exercise or block not found");
      }
    }

    if (currentIndex === newIndex) {
      return; // No move needed
    }

    // Get all exercises and blocks in the session ordered by index
    const allSelectedExercises = await db.select(
      "SELECT id, \"index\", 'selected_exercise' as type FROM selected_exercises WHERE session_id = ? AND block_id IS NULL AND deleted_at IS NULL",
      [sessionId]
    );

    const allTrainingBlocks = await db.select(
      "SELECT id, \"index\", 'training_block' as type FROM training_blocks WHERE session_id = ? AND deleted_at IS NULL",
      [sessionId]
    );

    // Combine and sort by index
    const allItems = [...allSelectedExercises, ...allTrainingBlocks].sort(
      (a, b) => a.index - b.index
    );

    // Update indices for affected items
    const recordsToSync: PendingRecord[] = [];

    if (currentIndex < newIndex) {
      // Moving down: shift items between current and new index up
      for (const item of allItems) {
        if (item.index > currentIndex && item.index <= newIndex) {
          if (item.type === "selected_exercise") {
            await db.execute(
              'UPDATE selected_exercises SET "index" = ? WHERE id = ?',
              [item.index - 1, item.id]
            );
            recordsToSync.push({
              tableName: "selected_exercises",
              id: item.id,
            });
          } else {
            await db.execute(
              'UPDATE training_blocks SET "index" = ? WHERE id = ?',
              [item.index - 1, item.id]
            );
            recordsToSync.push({
              tableName: "training_blocks",
              id: item.id,
            });
          }
        }
      }
    } else {
      // Moving up: shift items between new and current index down
      for (const item of allItems) {
        if (item.index >= newIndex && item.index < currentIndex) {
          if (item.type === "selected_exercise") {
            await db.execute(
              'UPDATE selected_exercises SET "index" = ? WHERE id = ?',
              [item.index + 1, item.id]
            );
            recordsToSync.push({
              tableName: "selected_exercises",
              id: item.id,
            });
          } else {
            await db.execute(
              'UPDATE training_blocks SET "index" = ? WHERE id = ?',
              [item.index + 1, item.id]
            );
            recordsToSync.push({
              tableName: "training_blocks",
              id: item.id,
            });
          }
        }
      }
    }

    // Update the moved item to its new index
    if (isTrainingBlock) {
      await db.execute('UPDATE training_blocks SET "index" = ? WHERE id = ?', [
        newIndex,
        exerciseId,
      ]);
    } else {
      await db.execute(
        'UPDATE selected_exercises SET "index" = ? WHERE id = ?',
        [newIndex, exerciseId]
      );
    }
    recordsToSync.push({ tableName, id: exerciseId });

    // Push records for sync
    await pushRecord(recordsToSync);
  } catch (error) {
    console.error("Error moving exercise:", error);
    throw error;
  }
};

const moveExerciseToIndexWithinBlock = async (
  exerciseId: string,
  newIndex: number,
  blockId: string,
  pushRecord: (records: PendingRecord[]) => Promise<void>
): Promise<void> => {
  const db = await (Database as any).load("sqlite:ergolab.db");

  try {
    // Get current index of the exercise within the block
    const exerciseData = await db.select(
      'SELECT "index" FROM selected_exercises WHERE id = ? AND block_id = ?',
      [exerciseId, blockId]
    );

    if (exerciseData.length === 0) {
      throw new Error("Exercise not found within the specified block");
    }

    const currentIndex = exerciseData[0].index;

    if (currentIndex === newIndex) {
      return; // No move needed
    }

    // Get all exercises in the block ordered by index
    const allExercises = await db.select(
      'SELECT id, "index" FROM selected_exercises WHERE block_id = ? AND deleted_at IS NULL ORDER BY "index"',
      [blockId]
    );

    // Update indices for affected exercises
    const recordsToSync: PendingRecord[] = [];

    if (currentIndex < newIndex) {
      // Moving down: shift exercises between current and new index up
      for (const exercise of allExercises) {
        if (exercise.index > currentIndex && exercise.index <= newIndex) {
          await db.execute(
            'UPDATE selected_exercises SET "index" = ? WHERE id = ? AND block_id = ?',
            [exercise.index - 1, exercise.id, blockId]
          );
          recordsToSync.push({
            tableName: "selected_exercises",
            id: exercise.id,
          });
        }
      }
    } else {
      // Moving up: shift exercises between new and current index down
      for (const exercise of allExercises) {
        if (exercise.index >= newIndex && exercise.index < currentIndex) {
          await db.execute(
            'UPDATE selected_exercises SET "index" = ? WHERE id = ? AND block_id = ?',
            [exercise.index + 1, exercise.id, blockId]
          );
          recordsToSync.push({
            tableName: "selected_exercises",
            id: exercise.id,
          });
        }
      }
    }

    // Update the moved exercise to its new index
    await db.execute(
      'UPDATE selected_exercises SET "index" = ? WHERE id = ? AND block_id = ?',
      [newIndex, exerciseId, blockId]
    );
    recordsToSync.push({ tableName: "selected_exercises", id: exerciseId });

    // Push records for sync
    await pushRecord(recordsToSync);
  } catch (error) {
    console.error("Error moving exercise within block:", error);
    throw error;
  }
};

// Helper function to delete a session
const deleteSession = async (
  sessionId: string,
  pushRecord: (records: PendingRecord[]) => Promise<void>,
  externalDb?: any
): Promise<void> => {
  try {
    const db =
      externalDb || (await (Database as any).load("sqlite:ergolab.db"));

    await db.execute(
      "UPDATE sessions SET deleted_at = datetime('now') WHERE id = ?",
      [sessionId]
    );
    await pushRecord([{ tableName: "sessions", id: sessionId }]);
  } catch (error) {
    console.error("Error deleting session:", error);
    throw error;
  }
};

// Helper function to delete a training block
const deleteTrainingBlock = async (
  blockId: string,
  pushRecord: (records: PendingRecord[]) => Promise<void>,
  externalDb?: any
): Promise<void> => {
  const db = externalDb || (await (Database as any).load("sqlite:ergolab.db"));

  try {
    await db.execute(
      "UPDATE training_blocks SET deleted_at = datetime('now') WHERE id = ?",
      [blockId]
    );
    await pushRecord([{ tableName: "training_blocks", id: blockId }]);
  } catch (error) {
    console.error("Error deleting training block:", error);
    throw error;
  }
};

// Helper function to delete a selected exercise
const deleteSelectedExercise = async (
  exerciseId: string,
  pushRecord: (records: PendingRecord[]) => Promise<void>,
  externalDb?: any
): Promise<void> => {
  const db = externalDb || (await (Database as any).load("sqlite:ergolab.db"));

  await db.execute(
    "UPDATE selected_exercises SET deleted_at = datetime('now') WHERE id = ?",
    [exerciseId]
  );

  if (externalDb) {
    return;
  }
  await pushRecord([{ tableName: "selected_exercises", id: exerciseId }]);
};

const deleteTrainingPlan = async (
  planId: string,
  pushRecord: (records: PendingRecord[]) => Promise<void>,
  externalDb?: any
): Promise<PendingRecord[]> => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    await dbToUse.execute(
      "UPDATE training_plans SET deleted_at = datetime('now') WHERE id = ?",
      [planId]
    );

    if (isManagingTransaction) {
      await dbToUse.execute("COMMIT");
      await pushRecord([{ tableName: "training_plans", id: planId }]);
    } else {
      return [{ tableName: "training_plans", id: planId }];
    }
  } catch (error) {
    if (isManagingTransaction) {
      console.error("Error during delete training plan, rolling back:", error);
      await dbToUse.execute("ROLLBACK");
    }
    throw error;
  }
};

const getTrainingModels = async (userId: string): Promise<TrainingModel[]> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    // First, get all training models metadata
    const rawModels: any[] = await db.select(
      `SELECT tm.id, tm.name, tm.description, tm.training_plan_id, tm.created_at, tp.user_id
       FROM training_models tm 
       JOIN training_plans tp ON tm.training_plan_id = tp.id 
       WHERE tm.deleted_at IS NULL AND tp.deleted_at IS NULL AND tp.user_id = ?
       ORDER BY tm.created_at DESC`,
      [userId]
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
  userId: string,
  pushRecord: (records: PendingRecord[]) => Promise<void>
): Promise<void> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");
    const recordsToSync: PendingRecord[] = [];
    await db.execute("BEGIN TRANSACTION");

    try {
      const planState: PlanState = {
        id: model.trainingPlanId,
        nOfWeeks: model.nOfWeeks,
        nOfSessions: model.nOfSessions,
        sessions: model.sessions,
      };
      const planRecords = await addTrainingPlan(
        planState,
        userId,
        pushRecord,
        db
      );
      recordsToSync.push(...planRecords);

      await db.execute(
        `INSERT INTO training_models (id, name, description, training_plan_id, created_at)
           VALUES (?, ?, ?, ?, datetime('now'))`,
        [model.id, model.name, model.description, model.trainingPlanId]
      );
      await db.execute("COMMIT");
      recordsToSync.push({ tableName: "training_models", id: model.id });
      await pushRecord(recordsToSync);
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

const deleteTrainingModel = async (
  modelId: string,
  pushRecord: (records: PendingRecord[]) => Promise<void>
): Promise<void> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    try {
      await db.execute(
        "UPDATE training_models SET deleted_at = datetime('now') WHERE id = ?",
        [modelId]
      );

      await pushRecord([{ tableName: "training_models", id: modelId }]);
    } catch (innerError) {
      console.error("Error deleting training model, rolling back:", innerError);
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

    await db.execute(
      `INSERT INTO exercises (id, name, video_ref, created_at)
         VALUES (?, ?, ?, datetime('now'))`,
      [exerciseId, exercise.name, exercise.videoRef]
    );
  } catch (error) {
    console.error("Failed to save exercise:", error);
    throw error;
  }
};

const updateTrainingPlan = async (
  planState: PlanState,
  pushRecord: (records: PendingRecord[]) => Promise<void>
): Promise<void> => {
  const db = await (Database as any).load("sqlite:ergolab.db");

  try {
    await db.execute("BEGIN TRANSACTION");

    const existingPlan = await db.select(
      "SELECT id FROM training_plans WHERE id = ? AND deleted_at IS NULL",
      [planState.id]
    );

    if (existingPlan.length === 0) {
      throw new Error(`Training plan with ID ${planState.id} not found`);
    }

    await db.execute(
      `UPDATE training_plans 
       SET n_of_weeks = ?, n_of_sessions = ?
       WHERE id = ?`,
      [planState.nOfWeeks, planState.nOfSessions, planState.id]
    );

    await db.execute("COMMIT");
    await pushRecord([{ tableName: "training_plans", id: planState.id }]);
  } catch (error) {
    console.error("Error updating training plan, rolling back:", error);
    await db.execute("ROLLBACK");
    throw error;
  }
};

const updateTrainingModel = async (
  model: TrainingModel,
  pushRecord: (records: PendingRecord[]) => Promise<void>
): Promise<void> => {
  const db = await (Database as any).load("sqlite:ergolab.db");
  const recordsToSync: PendingRecord[] = [];

  try {
    await db.execute("BEGIN TRANSACTION");

    const existingModel = await db.select(
      "SELECT id FROM training_models WHERE id = ? AND deleted_at IS NULL",
      [model.id]
    );

    if (existingModel.length === 0) {
      throw new Error(`Training model for plan ID ${model.id} not found`);
    }

    await db.execute(
      `UPDATE training_models 
       SET name = ?, description = ?
       WHERE id = ?`,
      [model.name, model.description, model.id]
    );
    recordsToSync.push({ tableName: "training_models", id: model.id });
    await pushRecord(recordsToSync);
  } catch (error) {
    console.error("Error updating training model:", error);
    throw error;
  }
};

const updateSession = async (
  session: Session,
  pushRecord: (records: PendingRecord[]) => Promise<void>,
  externalDb?: any
): Promise<void> => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    const existingSession = await dbToUse.select(
      "SELECT id FROM sessions WHERE id = ? AND deleted_at IS NULL",
      [session.id]
    );

    if (existingSession.length === 0) {
      throw new Error(`Session with ID ${session.id} not found`);
    }

    await dbToUse.execute(`UPDATE sessions SET name = ? WHERE id = ?`, [
      session.name,
      session.id,
    ]);

    if (isManagingTransaction) {
      await dbToUse.execute("COMMIT");
      await pushRecord([{ tableName: "sessions", id: session.id }]);
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
  pushRecord: (records: PendingRecord[]) => Promise<void>,
  externalDb?: any
): Promise<void> => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    const existingExercise = await dbToUse.select(
      "SELECT id FROM selected_exercises WHERE id = ? AND deleted_at IS NULL",
      [exercise.id]
    );

    if (existingExercise.length === 0) {
      throw new Error(`Selected exercise with ID ${exercise.id} not found`);
    }

    await dbToUse.execute(
      `UPDATE selected_exercises 
       SET exercise_id = ?, series = ?, repetitions = ?, effort = ?, rest_time = ?, comments = ?
       WHERE id = ?`,
      [
        exercise.exerciseId,
        exercise.series,
        exercise.repetitions,
        exercise.effort,
        exercise.restTime,
        exercise.comments,
        exercise.id,
      ]
    );

    if (isManagingTransaction) {
      await dbToUse.execute("COMMIT");
      await pushRecord([{ tableName: "selected_exercises", id: exercise.id }]);
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
  pushRecord: (records: PendingRecord[]) => Promise<void>,
  externalDb?: any
): Promise<void> => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    const existingBlock = await dbToUse.select(
      "SELECT id FROM training_blocks WHERE id = ? AND deleted_at IS NULL",
      [block.id]
    );

    if (existingBlock.length === 0) {
      throw new Error(`Training block with ID ${block.id} not found`);
    }

    await dbToUse.execute(
      `UPDATE training_blocks 
       SET name = ?, series = ?, repetitions = ?, effort = ?, block_model = ?, comments = ?, rest_time = ?
       WHERE id = ?`,
      [
        block.name,
        block.series,
        block.repetitions,
        block.effort,
        block.blockModel,
        block.comments,
        block.restTime,
        block.id,
      ]
    );
    if (isManagingTransaction) {
      await dbToUse.execute("COMMIT");
      await pushRecord([{ tableName: "training_blocks", id: block.id }]);
    }
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

    await db.execute(
      `UPDATE exercises 
       SET name = ?, video_ref = ?
       WHERE id = ?`,
      [exercise.name, exercise.videoRef, exercise.id]
    );
  } catch (error) {
    console.error("Failed to update exercise:", error);
    throw error;
  }
};

const deleteExercise = async (exerciseId: string): Promise<void> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    await db.execute(
      "UPDATE exercises SET deleted_at = datetime('now') WHERE id = ?",
      [exerciseId]
    );
  } catch (error) {
    console.error("Failed to delete exercise:", error);
    throw error;
  }
};

const updateProgression = async (
  progression: Progression,
  pushRecord: (records: PendingRecord[]) => Promise<void>
): Promise<void> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    await db.execute(
      "UPDATE progressions SET series = ?, repetitions = ?, effort = ? WHERE id = ?",
      [
        progression.series,
        progression.repetitions,
        progression.effort,
        progression.id,
      ]
    );
    await pushRecord([{ tableName: "progressions", id: progression.id }]);
  } catch (error) {
    console.error("Error updating progression:", error);
    throw error;
  }
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
  updateProgression,
  getExercises,
  moveExerciseToIndex,
  moveExerciseToIndexWithinBlock,
};
