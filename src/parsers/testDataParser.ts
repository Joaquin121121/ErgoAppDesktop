import Database from "@tauri-apps/plugin-sql";
import type {
  StudyType,
  CompletedStudy,
  JumpTime,
  BoscoResult,
  MultipleJumpsResult,
  MultipleDropJumpResult,
  CMJResult,
  SquatJumpResult,
  AbalakovResult,
  CustomStudyResult,
} from "../types/Studies";
import { v4 as uuidv4 } from "uuid";

export const deleteTest = async (
  testId: string,
  studyType: StudyType,
  db?: any
) => {
  const dbToUse = db || (await (Database as any).load("sqlite:ergolab.db"));
  try {
    if (studyType === "bosco") {
      dbToUse.execute(
        `UPDATE bosco_result 
        SET deleted_at = ?
        WHERE id = ?`,
        [new Date().toISOString(), testId]
      );
    } else if (studyType === "multipleDropJump") {
      dbToUse.execute(
        `UPDATE multiple_drop_jump_result 
        SET deleted_at = ?
        WHERE id = ?`,
        [new Date().toISOString(), testId]
      );
    } else {
      dbToUse.execute(
        `UPDATE base_result 
        SET deleted_at = ?
        WHERE id = ?`,
        [new Date().toISOString(), testId]
      );
    }
    return "success";
  } catch (error) {
    console.error(error);
    return "error";
  }
};

const createBaseResult = async (
  db: any,
  athleteId: string,
  takeoffFoot: "right" | "left" | "both",
  sensitivity: number
) => {
  const baseResultId = uuidv4();
  const currentTimestamp = new Date().toISOString();

  try {
    await db.execute(
      `INSERT INTO base_result (id, takeoff_foot, sensitivity, created_at, last_changed, athlete_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        baseResultId,
        takeoffFoot,
        sensitivity,
        currentTimestamp,
        currentTimestamp,
        athleteId,
      ]
    );

    return baseResultId;
  } catch (error) {
    return "error";
  }
};

const createJumpTimes = async (
  db: any,
  baseResultId: string,
  times: JumpTime[]
) => {
  try {
    const currentTimestamp = new Date().toISOString();

    for (let index = 0; index < times.length; index++) {
      const time = times[index];
      await db.execute(
        `INSERT INTO jump_time (id, created_at, base_result_id, "index", time, deleted, floor_time, stiffness, performance, last_changed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          currentTimestamp,
          baseResultId,
          index,
          time.time,
          time.deleted ? 1 : 0, // SQLite uses 1/0 for boolean
          time.floorTime || null,
          time.stiffness || null,
          time.performance || null,
          currentTimestamp,
        ]
      );
    }

    return "success";
  } catch (error) {
    return "error";
  }
};

export const addBasicResult = async (
  study: CompletedStudy,
  athleteId: string,
  externalDb?: any
) => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    const result = study.results as
      | CMJResult
      | SquatJumpResult
      | AbalakovResult
      | CustomStudyResult;

    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    try {
      const baseResultId = await createBaseResult(
        dbToUse,
        athleteId,
        result.takeoffFoot,
        result.sensitivity
      );

      if (baseResultId === "error")
        throw new Error("Failed to create base_result");

      const basicResultId = uuidv4();
      const currentTimestamp = new Date().toISOString();

      await dbToUse.execute(
        `INSERT INTO basic_result (id, created_at, last_changed, type, load, loadunit, base_result_id, bosco_result_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          basicResultId,
          currentTimestamp,
          currentTimestamp,
          result.type,
          result.load,
          result.loadUnit,
          baseResultId,
          null,
        ]
      );

      const jumpTimeError = await createJumpTimes(
        dbToUse,
        baseResultId,
        result.times
      );

      if (jumpTimeError) throw jumpTimeError;

      if (isManagingTransaction) {
        await dbToUse.execute("COMMIT");
      }

      return {
        success: true,
        resultId: basicResultId,
        baseResultId,
      };
    } catch (innerError) {
      if (isManagingTransaction) {
        await dbToUse.execute("ROLLBACK");
      }
      throw innerError;
    }
  } catch (error) {
    console.error("Error adding basic result:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const addBoscoResult = async (
  study: CompletedStudy,
  athleteId: string,
  externalDb?: any
) => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    const result = study.results as BoscoResult;

    const currentTimestamp = new Date().toISOString();

    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    try {
      const boscoResultId = uuidv4();

      await dbToUse.execute(
        `INSERT INTO bosco_result (id, created_at, last_changed, athlete_id)
         VALUES (?, ?, ?, ?)`,
        [boscoResultId, currentTimestamp, currentTimestamp, athleteId]
      );

      const tests = [
        { type: "cmj", data: result.cmj },
        { type: "squatJump", data: result.squatJump },
        { type: "abalakov", data: result.abalakov },
      ];

      for (const test of tests) {
        const baseResultId = await createBaseResult(
          dbToUse,
          athleteId,
          test.data.takeoffFoot,
          test.data.sensitivity
        );

        if (baseResultId === "error")
          throw new Error("Failed to create base_result for Bosco sub-test");

        const basicResultId = uuidv4();
        await dbToUse.execute(
          `INSERT INTO basic_result (id, created_at, last_changed, type, load, loadunit, base_result_id, bosco_result_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            basicResultId,
            currentTimestamp,
            currentTimestamp,
            test.type,
            test.data.load,
            test.data.loadUnit,
            baseResultId,
            boscoResultId,
          ]
        );

        const jumpTimeError = await createJumpTimes(
          dbToUse,
          baseResultId,
          test.data.times
        );
        if (jumpTimeError) throw jumpTimeError;
      }

      if (isManagingTransaction) {
        await dbToUse.execute("COMMIT");
      }

      return {
        success: true,
        resultId: boscoResultId,
      };
    } catch (innerError) {
      if (isManagingTransaction) {
        await dbToUse.execute("ROLLBACK");
      }
      throw innerError;
    }
  } catch (error) {
    console.error("Error adding Bosco result:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const addMultipleJumpsResult = async (
  study: CompletedStudy,
  athleteId: string,
  externalDb?: any
) => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    const result = study.results as MultipleJumpsResult;

    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    try {
      const baseResultId = await createBaseResult(
        dbToUse,
        athleteId,
        result.takeoffFoot,
        result.sensitivity
      );

      if (baseResultId === "error")
        throw new Error("Failed to create base_result");

      const multipleJumpsResultId = uuidv4();
      const currentTimestamp = new Date().toISOString();

      await dbToUse.execute(
        `INSERT INTO multiple_jumps_result (id, created_at, last_changed, criteria, criteria_value, base_result_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          multipleJumpsResultId,
          currentTimestamp,
          currentTimestamp,
          result.criteria,
          result.criteriaValue,
          baseResultId,
        ]
      );

      const jumpTimeError = await createJumpTimes(
        dbToUse,
        baseResultId,
        result.times
      );
      if (jumpTimeError) throw jumpTimeError;

      if (isManagingTransaction) {
        await dbToUse.execute("COMMIT");
      }

      return {
        success: true,
        resultId: multipleJumpsResultId,
        baseResultId,
      };
    } catch (innerError) {
      if (isManagingTransaction) {
        await dbToUse.execute("ROLLBACK");
      }
      throw innerError;
    }
  } catch (error) {
    console.error("Error adding Multiple Jumps result:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const addMultipleDropJumpResult = async (
  study: CompletedStudy,
  athleteId: string,
  externalDb?: any
) => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    const result = study.results as MultipleDropJumpResult;

    const currentTimestamp = new Date().toISOString();

    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    try {
      const multipleDropJumpId = uuidv4();
      await dbToUse.execute(
        `INSERT INTO multiple_drop_jump_result (id, created_at, last_changed, height_unit, takeoff_foot, best_height, athlete_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          multipleDropJumpId,
          currentTimestamp,
          currentTimestamp,
          result.heightUnit,
          result.takeoffFoot,
          result.bestHeight,
          athleteId,
        ]
      );

      for (const dropJump of result.dropJumps) {
        const baseResultId = await createBaseResult(
          dbToUse,
          athleteId,
          dropJump.takeoffFoot,
          dropJump.sensitivity
        );

        if (baseResultId === "error")
          throw new Error(
            "Failed to create base_result for drop jump sub-test"
          );

        const dropJumpResultId = uuidv4();
        await dbToUse.execute(
          `INSERT INTO drop_jump_result (id, created_at, last_changed, height, stiffness, base_result_id, multiple_drop_jump_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            dropJumpResultId,
            currentTimestamp,
            currentTimestamp,
            dropJump.height,
            dropJump.stiffness,
            baseResultId,
            multipleDropJumpId,
          ]
        );

        const jumpTimeError = await createJumpTimes(
          dbToUse,
          baseResultId,
          dropJump.times
        );
        if (jumpTimeError) throw jumpTimeError;
      }

      if (isManagingTransaction) {
        await dbToUse.execute("COMMIT");
      }

      return {
        success: true,
        resultId: multipleDropJumpId,
      };
    } catch (innerError) {
      if (isManagingTransaction) {
        await dbToUse.execute("ROLLBACK");
      }
      throw innerError;
    }
  } catch (error) {
    console.error("Error adding Multiple Drop Jump result:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const addResult = async (
  study: CompletedStudy,
  athleteId: string,
  db?: any
) => {
  const resultType = study.results.type;

  switch (resultType) {
    case "bosco":
      return await addBoscoResult(study, athleteId, db);

    case "multipleDropJump":
      return await addMultipleDropJumpResult(study, athleteId, db);

    case "multipleJumps":
      return await addMultipleJumpsResult(study, athleteId, db);

    case "cmj":
    case "squatJump":
    case "abalakov":
    case "custom":
      return await addBasicResult(study, athleteId, db);
  }
};

export const addMultipleResults = async (data: {
  studies: CompletedStudy[];
  ids: string[];
}) => {
  if (data.studies.length !== data.ids.length) {
    return {
      success: false,
      error: "Studies and athlete IDs arrays must have the same length.",
      results: [],
    };
  }

  const db = await (Database as any).load("sqlite:ergolab.db");
  try {
    await db.execute("BEGIN TRANSACTION");

    const operationResults = [];
    for (let i = 0; i < data.studies.length; i++) {
      const study = data.studies[i];
      const athleteId = data.ids[i];

      const result = await addResult(study, athleteId, db);

      operationResults.push(result);
      if (!result.success) {
        console.error(
          `Failed to add result for study index ${i} (Athlete ID: ${athleteId}). Error: ${result.error}. Rolling back.`
        );
        await db.execute("ROLLBACK");
        return {
          success: false,
          error: `Failed to add result for study index ${i} (Athlete ID: ${athleteId}): ${result.error}`,
          results: operationResults,
        };
      }
    }

    await db.execute("COMMIT");
    console.log("Successfully added all results. Transaction committed.");
    return { success: true, results: operationResults };
  } catch (error) {
    console.error(
      "Critical error during multiple results addition, attempting rollback:",
      error
    );
    try {
      await db.execute("ROLLBACK");
      console.log("Rollback successful after critical error.");
    } catch (rollbackError) {
      console.error("Failed to rollback after critical error:", rollbackError);
    }
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown critical error occurred during multiple results addition.",
      results: (error as any).results || [],
    };
  }
};
