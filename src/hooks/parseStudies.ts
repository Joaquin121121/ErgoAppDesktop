import Database from "@tauri-apps/plugin-sql";
import { v4 as uuidv4 } from "uuid";
import {
  CompletedStudy,
  BoscoResult,
  MultipleJumpsResult,
  MultipleDropJumpResult,
  JumpTime,
} from "../types/Studies";

/**
 * Performs a cascading soft delete of a Bosco study and all its related data
 * @param boscoResultId The UUID of the bosco_result to delete
 * @param externalDb Optional external database connection to use
 * @returns Object with success status and any error message
 */
export const deleteBoscoResult = async (
  boscoResultId: string,
  externalDb?: any
) => {
  try {
    const dbToUse =
      externalDb || (await (Database as any).load("sqlite:ergolab.db"));
    const isManagingTransaction = !externalDb;
    const currentTimestamp = new Date().toISOString();

    // Use transaction for atomicity only if managing it locally
    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    try {
      // 1. Set deleted_at for the bosco_result record
      await dbToUse.execute(
        "UPDATE bosco_result SET deleted_at = ? WHERE id = ?",
        [currentTimestamp, boscoResultId]
      );

      // 2. Find all basic_result records that reference this bosco_result
      const basicResults = await dbToUse.select(
        "SELECT id, base_result_id FROM basic_result WHERE bosco_result_id = ?",
        [boscoResultId]
      );

      // Extract base_result_ids from the basic_results
      const baseResultIds =
        basicResults?.map((br: any) => br.base_result_id) || [];
      const basicResultIds = basicResults?.map((br: any) => br.id) || [];

      // 3. Set deleted_at for all basic_result records
      if (basicResultIds.length > 0) {
        const placeholders = basicResultIds.map(() => "?").join(",");
        await dbToUse.execute(
          `UPDATE basic_result SET deleted_at = ? WHERE id IN (${placeholders})`,
          [currentTimestamp, ...basicResultIds]
        );
      }

      // 4. Set deleted_at for all base_result records
      if (baseResultIds.length > 0) {
        const placeholders = baseResultIds.map(() => "?").join(",");
        await dbToUse.execute(
          `UPDATE base_result SET deleted_at = ? WHERE id IN (${placeholders})`,
          [currentTimestamp, ...baseResultIds]
        );

        // 5. Set deleted_at for all jump_time records associated with these base_results
        await dbToUse.execute(
          `UPDATE jump_time SET deleted_at = ? WHERE base_result_id IN (${placeholders})`,
          [currentTimestamp, ...baseResultIds]
        );
      }

      // Commit transaction only if managing it locally
      if (isManagingTransaction) {
        await dbToUse.execute("COMMIT");
      }
      return { success: true };
    } catch (innerError) {
      // Rollback transaction on error only if managing it locally
      if (isManagingTransaction) {
        await dbToUse.execute("ROLLBACK");
      }
      throw innerError;
    }
  } catch (error) {
    console.error("Error deleting Bosco study:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

/**
 * Performs a cascading soft delete of a Multiple Drop Jump result and all its related data
 * @param multipleDropJumpId The UUID of the multiple_drop_jump_result to delete
 * @param externalDb Optional external database connection to use
 * @returns Object with success status and any error message
 */
export const deleteMultipleDropJumpResult = async (
  multipleDropJumpId: string,
  externalDb?: any
) => {
  try {
    const dbToUse =
      externalDb || (await (Database as any).load("sqlite:ergolab.db"));
    const isManagingTransaction = !externalDb;
    const currentTimestamp = new Date().toISOString();

    // Use transaction for atomicity only if managing it locally
    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    try {
      // 1. Set deleted_at for the multiple_drop_jump_result record
      await dbToUse.execute(
        "UPDATE multiple_drop_jump_result SET deleted_at = ? WHERE id = ?",
        [currentTimestamp, multipleDropJumpId]
      );

      // 2. Find all drop_jump_result records that reference this multiple_drop_jump
      const dropJumpResults = await dbToUse.select(
        "SELECT id, base_result_id FROM drop_jump_result WHERE multiple_drop_jump_id = ?",
        [multipleDropJumpId]
      );

      // Extract base_result_ids from the drop_jump_results
      const baseResultIds =
        dropJumpResults?.map((dj: any) => dj.base_result_id) || [];
      const dropJumpResultIds = dropJumpResults?.map((dj: any) => dj.id) || [];

      // 3. Set deleted_at for all drop_jump_result records
      if (dropJumpResultIds.length > 0) {
        const placeholders = dropJumpResultIds.map(() => "?").join(",");
        await dbToUse.execute(
          `UPDATE drop_jump_result SET deleted_at = ? WHERE id IN (${placeholders})`,
          [currentTimestamp, ...dropJumpResultIds]
        );
      }

      // 4. Set deleted_at for all base_result records
      if (baseResultIds.length > 0) {
        const placeholders = baseResultIds.map(() => "?").join(",");
        await dbToUse.execute(
          `UPDATE base_result SET deleted_at = ? WHERE id IN (${placeholders})`,
          [currentTimestamp, ...baseResultIds]
        );

        // 5. Set deleted_at for all jump_time records associated with these base_results
        await dbToUse.execute(
          `UPDATE jump_time SET deleted_at = ? WHERE base_result_id IN (${placeholders})`,
          [currentTimestamp, ...baseResultIds]
        );
      }

      // Commit transaction only if managing it locally
      if (isManagingTransaction) {
        await dbToUse.execute("COMMIT");
      }
      return { success: true };
    } catch (innerError) {
      // Rollback transaction on error only if managing it locally
      if (isManagingTransaction) {
        await dbToUse.execute("ROLLBACK");
      }
      throw innerError;
    }
  } catch (error) {
    console.error("Error deleting Multiple Drop Jump result:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

/**
 * Performs a cascading soft delete of a Basic Result and all its related data
 * @param basicResultId The UUID of the basic_result to delete
 * @param externalDb Optional external database connection to use
 * @returns Object with success status and any error message
 */
export const deleteBasicResult = async (
  basicResultId: string,
  externalDb?: any
) => {
  console.log("Deleting basic result", basicResultId);
  try {
    const dbToUse =
      externalDb || (await (Database as any).load("sqlite:ergolab.db"));
    const isManagingTransaction = !externalDb;
    const currentTimestamp = new Date().toISOString();

    // Use transaction for atomicity only if managing it locally
    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    try {
      // 1. Find the base_result_id for this basic_result
      const basicResults = await dbToUse.select(
        "SELECT base_result_id FROM basic_result WHERE id = ?",
        [basicResultId]
      );

      if (!basicResults || basicResults.length === 0) {
        throw new Error("Basic result not found");
      }

      const baseResultId = basicResults[0].base_result_id;

      // 2. Set deleted_at for the basic_result record
      await dbToUse.execute(
        "UPDATE basic_result SET deleted_at = ? WHERE id = ?",
        [currentTimestamp, basicResultId]
      );

      // 3. Set deleted_at for the base_result record
      await dbToUse.execute(
        "UPDATE base_result SET deleted_at = ? WHERE id = ?",
        [currentTimestamp, baseResultId]
      );

      // 4. Set deleted_at for all jump_time records associated with this base_result
      await dbToUse.execute(
        "UPDATE jump_time SET deleted_at = ? WHERE base_result_id = ?",
        [currentTimestamp, baseResultId]
      );

      // Commit transaction only if managing it locally
      if (isManagingTransaction) {
        await dbToUse.execute("COMMIT");
      }
      return { success: true };
    } catch (innerError) {
      // Rollback transaction on error only if managing it locally
      if (isManagingTransaction) {
        await dbToUse.execute("ROLLBACK");
      }
      throw innerError;
    }
  } catch (error) {
    console.error("Error deleting Basic Result:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

/**
 * Performs a cascading soft delete of a Multiple Jumps Result and all its related data
 * @param multipleJumpsResultId The UUID of the multiple_jumps_result to delete
 * @param externalDb Optional external database connection to use
 * @returns Object with success status and any error message
 */
export const deleteMultipleJumpsResult = async (
  multipleJumpsResultId: string,
  externalDb?: any
) => {
  try {
    const dbToUse =
      externalDb || (await (Database as any).load("sqlite:ergolab.db"));
    const isManagingTransaction = !externalDb;
    const currentTimestamp = new Date().toISOString();

    // Use transaction for atomicity only if managing it locally
    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    try {
      // 1. Find the base_result_id for this multiple_jumps_result
      const multipleJumpsResults = await dbToUse.select(
        "SELECT base_result_id FROM multiple_jumps_result WHERE id = ?",
        [multipleJumpsResultId]
      );

      if (!multipleJumpsResults || multipleJumpsResults.length === 0) {
        throw new Error("Multiple jumps result not found");
      }

      const baseResultId = multipleJumpsResults[0].base_result_id;

      // 2. Set deleted_at for the multiple_jumps_result record
      await dbToUse.execute(
        "UPDATE multiple_jumps_result SET deleted_at = ? WHERE id = ?",
        [currentTimestamp, multipleJumpsResultId]
      );

      // 3. Set deleted_at for the base_result record
      await dbToUse.execute(
        "UPDATE base_result SET deleted_at = ? WHERE id = ?",
        [currentTimestamp, baseResultId]
      );

      // 4. Set deleted_at for all jump_time records associated with this base_result
      await dbToUse.execute(
        "UPDATE jump_time SET deleted_at = ? WHERE base_result_id = ?",
        [currentTimestamp, baseResultId]
      );

      // Commit transaction only if managing it locally
      if (isManagingTransaction) {
        await dbToUse.execute("COMMIT");
      }
      return { success: true };
    } catch (innerError) {
      // Rollback transaction on error only if managing it locally
      if (isManagingTransaction) {
        await dbToUse.execute("ROLLBACK");
      }
      throw innerError;
    }
  } catch (error) {
    console.error("Error deleting Multiple Jumps Result:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

/**
 * High-level function to delete a study result based on its type
 * @param resultId UUID of the result to delete
 * @param studyType Type of study/result
 * @param db Optional external database connection to use
 * @returns Object with success status and any error message
 */
export const deleteResult = async (
  resultId: string,
  studyType:
    | "bosco"
    | "multipleDropJump"
    | "multipleJumps"
    | "cmj"
    | "squatJump"
    | "abalakov"
    | "custom",
  db?: any
) => {
  try {
    switch (studyType) {
      case "bosco":
        return await deleteBoscoResult(resultId, db);

      case "multipleDropJump":
        return await deleteMultipleDropJumpResult(resultId, db);

      case "multipleJumps":
        return await deleteMultipleJumpsResult(resultId, db);

      case "cmj":
      case "squatJump":
      case "abalakov":
      case "custom":
        return await deleteBasicResult(resultId, db);

      default:
        return {
          success: false,
          error: `Unsupported study type: ${studyType}`,
        };
    }
  } catch (error) {
    console.error(`Error deleting ${studyType} result:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

/**
 * Creates a base_result record in the database
 * @param db The database connection to use (to maintain transaction context)
 * @param athleteId The athlete's ID
 * @param takeoffFoot The takeoff foot used
 * @param sensitivity The sensitivity value
 * @returns The created base_result ID and any error
 */
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

    return { baseResultId, error: null };
  } catch (error) {
    return { baseResultId: null, error };
  }
};

/**
 * Creates jump_time records in the database
 * @param db The database connection to use (to maintain transaction context)
 * @param baseResultId The base_result ID these jump times belong to
 * @param times Array of jump time data
 * @returns Success status and any error
 */
const createJumpTimes = async (
  db: any,
  baseResultId: string,
  times: JumpTime[]
) => {
  if (!times || times.length === 0) {
    return { success: true, error: null };
  }

  try {
    const currentTimestamp = new Date().toISOString();

    // Insert each jump time record
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

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * Adds a basic result (CMJ, SquatJump, Abalakov, or Custom) to the database
 * @param study The completed study data
 * @param athleteId The athlete's ID
 * @param externalDb Optional external database connection to use
 * @returns Object with success status, result ID, and any error
 */
export const addBasicResult = async (
  study: CompletedStudy,
  athleteId: string,
  externalDb?: any
) => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    const result = study.results;
    if (
      result.type !== "cmj" &&
      result.type !== "squatJump" &&
      result.type !== "abalakov" &&
      result.type !== "custom"
    ) {
      throw new Error(`Invalid basic result type: ${result.type}`);
    }

    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    try {
      // 1. Create base_result
      const { baseResultId, error: baseResultError } = await createBaseResult(
        dbToUse,
        athleteId,
        result.takeoffFoot,
        result.sensitivity
      );

      if (baseResultError) throw baseResultError;
      if (!baseResultId) throw new Error("Failed to create base_result");

      // 2. Create basic_result
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
          null, // Not part of a Bosco test
        ]
      );

      // 3. Create jump_time records
      const { error: jumpTimeError } = await createJumpTimes(
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

/**
 * Adds a bosco result to the database
 * @param study The completed study data
 * @param athleteId The athlete's ID
 * @param externalDb Optional external database connection to use
 * @returns Object with success status, result ID, and any error
 */
export const addBoscoResult = async (
  study: CompletedStudy,
  athleteId: string,
  externalDb?: any
) => {
  console.log(study);
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    const result = study.results as BoscoResult;
    if (result.type !== "bosco") {
      throw new Error(`Invalid result type for Bosco test: ${result.type}`);
    }

    const athleteCheck = await dbToUse.select(
      "SELECT id FROM athlete WHERE id = ? AND deleted_at IS NULL",
      [athleteId]
    );

    if (!athleteCheck || athleteCheck.length === 0) {
      throw new Error(`Athlete with ID ${athleteId} not found`);
    }

    const currentTimestamp = new Date().toISOString();

    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    try {
      // 1. Create bosco_result
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
        const { baseResultId, error: baseResultError } = await createBaseResult(
          dbToUse,
          athleteId,
          test.data.takeoffFoot,
          test.data.sensitivity
        );

        if (baseResultError) throw baseResultError;
        if (!baseResultId)
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

        const { error: jumpTimeError } = await createJumpTimes(
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

/**
 * Adds a multiple jumps result to the database
 * @param study The completed study data
 * @param athleteId The athlete's ID
 * @param externalDb Optional external database connection to use
 * @returns Object with success status, result ID, and any error
 */
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
    if (result.type !== "multipleJumps") {
      throw new Error(`Invalid result type for Multiple Jumps: ${result.type}`);
    }

    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    try {
      const { baseResultId, error: baseResultError } = await createBaseResult(
        dbToUse,
        athleteId,
        result.takeoffFoot,
        result.sensitivity
      );

      if (baseResultError) throw baseResultError;
      if (!baseResultId) throw new Error("Failed to create base_result");

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

      const { error: jumpTimeError } = await createJumpTimes(
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

/**
 * Adds a multiple drop jump result to the database
 * @param study The completed study data
 * @param athleteId The athlete's ID
 * @param externalDb Optional external database connection to use
 * @returns Object with success status, result ID, and any error
 */
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
    console.log("Result:", result);
    if (result.type !== "multipleDropJump") {
      throw new Error(
        `Invalid result type for Multiple Drop Jump: ${result.type}`
      );
    }

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
        const { baseResultId, error: baseResultError } = await createBaseResult(
          dbToUse,
          athleteId,
          dropJump.takeoffFoot,
          dropJump.sensitivity
        );

        if (baseResultError) throw baseResultError;
        if (!baseResultId)
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

        const { error: jumpTimeError } = await createJumpTimes(
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

/**
 * High-level function to add a study result based on its type
 * @param study The completed study data
 * @param athleteId The athlete's ID
 * @param db Optional external database connection to use
 * @returns Object with success status, result ID, and any error
 */
export const addResult = async (
  study: CompletedStudy,
  athleteId: string,
  db?: any
) => {
  try {
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

      default:
        // This case handles unsupported study types directly.
        console.error(`Unsupported study type: ${resultType}`);
        return {
          success: false,
          error: `Unsupported study type: ${resultType}`,
        };
    }
  } catch (error) {
    // This catch block is a fallback, primarily if an underlying add... function
    // throws an error not in the standard {success, error} format,
    // or if an unexpected error occurs within addResult itself.
    console.error(`Error adding result (via addResult function):`, error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error occurred during addResult",
    };
  }
};

/**
 * Adds multiple study results to the database within a single transaction.
 * @param data An object containing an array of studies and an array of corresponding athlete IDs.
 * @returns Object with overall success status, an array of individual operation results, and any error message if the transaction failed.
 */
export const addMultipleResults = async (data: {
  studies: CompletedStudy[];
  ids: string[];
}) => {
  if (!data || !data.studies || !data.ids) {
    return {
      success: false,
      error: "Invalid input: studies and ids arrays are required.",
      results: [],
    };
  }

  if (data.studies.length !== data.ids.length) {
    return {
      success: false,
      error: "Studies and athlete IDs arrays must have the same length.",
      results: [],
    };
  }

  if (data.studies.length === 0) {
    return { success: true, results: [] }; // No operations to perform
  }

  const db = await (Database as any).load("sqlite:ergolab.db");
  try {
    await db.execute("BEGIN TRANSACTION");

    const operationResults = [];
    for (let i = 0; i < data.studies.length; i++) {
      const study = data.studies[i];
      const athleteId = data.ids[i];

      // Log which study/athlete pair is being processed
      console.log(
        `Processing study ${i + 1}/${
          data.studies.length
        } for athlete ${athleteId}`
      );

      const result = await addResult(study, athleteId, db); // Pass the db instance

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
      results: (error as any).results || [], // If some partial results were collected before the error
    };
  }
};
