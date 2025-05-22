import { supabase } from "../supabase";
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
 * @returns Object with success status and any error message
 */
export const deleteBoscoResult = async (boscoResultId: string) => {
  try {
    const currentTimestamp = new Date().toISOString();

    // 1. Set deleted_at for the bosco_result record
    const { error: boscoError } = await supabase
      .from("bosco_result")
      .update({ deleted_at: currentTimestamp })
      .eq("id", boscoResultId);

    if (boscoError) throw boscoError;

    // 2. Find all basic_result records that reference this bosco_result
    const { data: basicResults, error: basicQueryError } = await supabase
      .from("basic_result")
      .select("id, base_result_id")
      .eq("bosco_result_id", boscoResultId);

    if (basicQueryError) throw basicQueryError;

    // Extract base_result_ids from the basic_results
    const baseResultIds = basicResults?.map((br) => br.base_result_id) || [];
    const basicResultIds = basicResults?.map((br) => br.id) || [];

    // 3. Set deleted_at for all basic_result records
    if (basicResultIds.length > 0) {
      const { error: basicUpdateError } = await supabase
        .from("basic_result")
        .update({ deleted_at: currentTimestamp })
        .in("id", basicResultIds);

      if (basicUpdateError) throw basicUpdateError;
    }

    // 4. Set deleted_at for all base_result records
    if (baseResultIds.length > 0) {
      const { error: baseUpdateError } = await supabase
        .from("base_result")
        .update({ deleted_at: currentTimestamp })
        .in("id", baseResultIds);

      if (baseUpdateError) throw baseUpdateError;

      // 5. Set deleted_at for all jump_time records associated with these base_results
      const { error: jumpTimeError } = await supabase
        .from("jump_time")
        .update({ deleted_at: currentTimestamp })
        .in("base_result_id", baseResultIds);

      if (jumpTimeError) throw jumpTimeError;
    }

    return { success: true };
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
 * @returns Object with success status and any error message
 */
export const deleteMultipleDropJumpResult = async (
  multipleDropJumpId: string
) => {
  try {
    const currentTimestamp = new Date().toISOString();

    // 1. Set deleted_at for the multiple_drop_jump_result record
    const { error: multipleDropJumpError } = await supabase
      .from("multiple_drop_jump_result")
      .update({ deleted_at: currentTimestamp })
      .eq("id", multipleDropJumpId);

    if (multipleDropJumpError) throw multipleDropJumpError;

    // 2. Find all drop_jump_result records that reference this multiple_drop_jump
    const { data: dropJumpResults, error: dropJumpQueryError } = await supabase
      .from("drop_jump_result")
      .select("id, base_result_id")
      .eq("multiple_drop_jump_id", multipleDropJumpId);

    if (dropJumpQueryError) throw dropJumpQueryError;

    // Extract base_result_ids from the drop_jump_results
    const baseResultIds = dropJumpResults?.map((dj) => dj.base_result_id) || [];
    const dropJumpResultIds = dropJumpResults?.map((dj) => dj.id) || [];

    // 3. Set deleted_at for all drop_jump_result records
    if (dropJumpResultIds.length > 0) {
      const { error: dropJumpUpdateError } = await supabase
        .from("drop_jump_result")
        .update({ deleted_at: currentTimestamp })
        .in("id", dropJumpResultIds);

      if (dropJumpUpdateError) throw dropJumpUpdateError;
    }

    // 4. Set deleted_at for all base_result records
    if (baseResultIds.length > 0) {
      const { error: baseUpdateError } = await supabase
        .from("base_result")
        .update({ deleted_at: currentTimestamp })
        .in("id", baseResultIds);

      if (baseUpdateError) throw baseUpdateError;

      // 5. Set deleted_at for all jump_time records associated with these base_results
      const { error: jumpTimeError } = await supabase
        .from("jump_time")
        .update({ deleted_at: currentTimestamp })
        .in("base_result_id", baseResultIds);

      if (jumpTimeError) throw jumpTimeError;
    }

    return { success: true };
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
 * @returns Object with success status and any error message
 */
export const deleteBasicResult = async (basicResultId: string) => {
  try {
    const currentTimestamp = new Date().toISOString();

    // 1. Find the base_result_id for this basic_result
    const { data: basicResult, error: basicQueryError } = await supabase
      .from("basic_result")
      .select("base_result_id")
      .eq("id", basicResultId)
      .single();

    if (basicQueryError) throw basicQueryError;

    if (!basicResult) {
      throw new Error("Basic result not found");
    }

    const baseResultId = basicResult.base_result_id;

    // 2. Set deleted_at for the basic_result record
    const { error: basicUpdateError } = await supabase
      .from("basic_result")
      .update({ deleted_at: currentTimestamp })
      .eq("id", basicResultId);

    if (basicUpdateError) throw basicUpdateError;

    // 3. Set deleted_at for the base_result record
    const { error: baseUpdateError } = await supabase
      .from("base_result")
      .update({ deleted_at: currentTimestamp })
      .eq("id", baseResultId);

    if (baseUpdateError) throw baseUpdateError;

    // 4. Set deleted_at for all jump_time records associated with this base_result
    const { error: jumpTimeError } = await supabase
      .from("jump_time")
      .update({ deleted_at: currentTimestamp })
      .eq("base_result_id", baseResultId);

    if (jumpTimeError) throw jumpTimeError;

    return { success: true };
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
 * @returns Object with success status and any error message
 */
export const deleteMultipleJumpsResult = async (
  multipleJumpsResultId: string
) => {
  try {
    const currentTimestamp = new Date().toISOString();

    // 1. Find the base_result_id for this multiple_jumps_result
    const { data: multipleJumpsResult, error: multipleJumpsQueryError } =
      await supabase
        .from("multiple_jumps_result")
        .select("base_result_id")
        .eq("id", multipleJumpsResultId)
        .single();

    if (multipleJumpsQueryError) throw multipleJumpsQueryError;

    if (!multipleJumpsResult) {
      throw new Error("Multiple jumps result not found");
    }

    const baseResultId = multipleJumpsResult.base_result_id;

    // 2. Set deleted_at for the multiple_jumps_result record
    const { error: multipleJumpsUpdateError } = await supabase
      .from("multiple_jumps_result")
      .update({ deleted_at: currentTimestamp })
      .eq("id", multipleJumpsResultId);

    if (multipleJumpsUpdateError) throw multipleJumpsUpdateError;

    // 3. Set deleted_at for the base_result record
    const { error: baseUpdateError } = await supabase
      .from("base_result")
      .update({ deleted_at: currentTimestamp })
      .eq("id", baseResultId);

    if (baseUpdateError) throw baseUpdateError;

    // 4. Set deleted_at for all jump_time records associated with this base_result
    const { error: jumpTimeError } = await supabase
      .from("jump_time")
      .update({ deleted_at: currentTimestamp })
      .eq("base_result_id", baseResultId);

    if (jumpTimeError) throw jumpTimeError;

    return { success: true };
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
    | "custom"
) => {
  try {
    switch (studyType) {
      case "bosco":
        return await deleteBoscoResult(resultId);

      case "multipleDropJump":
        return await deleteMultipleDropJumpResult(resultId);

      case "multipleJumps":
        return await deleteMultipleJumpsResult(resultId);

      case "cmj":
      case "squatJump":
      case "abalakov":
      case "custom":
        return await deleteBasicResult(resultId);

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
 * @param athleteId The athlete's ID
 * @param takeoffFoot The takeoff foot used
 * @param sensitivity The sensitivity value
 * @returns The created base_result ID and any error
 */
const createBaseResult = async (
  athleteId: string,
  takeoffFoot: "right" | "left" | "both",
  sensitivity: number
) => {
  const baseResultId = uuidv4();
  const currentTimestamp = new Date().toISOString();

  const { error } = await supabase.from("base_result").insert({
    id: baseResultId,
    takeoff_foot: takeoffFoot,
    sensitivity,
    created_at: currentTimestamp,
    last_changed: currentTimestamp,
    athlete_id: athleteId,
  });

  return { baseResultId, error };
};

/**
 * Creates jump_time records in the database
 * @param baseResultId The base_result ID these jump times belong to
 * @param times Array of jump time data
 * @returns Success status and any error
 */
const createJumpTimes = async (baseResultId: string, times: JumpTime[]) => {
  if (!times || times.length === 0) {
    return { success: true };
  }

  const currentTimestamp = new Date().toISOString();
  const jumpTimeRecords = times.map((time, index) => ({
    id: uuidv4(),
    created_at: currentTimestamp,
    base_result_id: baseResultId,
    index,
    time: time.time,
    deleted: time.deleted,
    floor_time: time.floorTime || null,
    stiffness: time.stiffness || null,
    performance: time.performance || null,
    last_changed: currentTimestamp,
  }));

  const { error } = await supabase.from("jump_time").insert(jumpTimeRecords);

  return { success: !error, error };
};

/**
 * Adds a basic result (CMJ, SquatJump, Abalakov, or Custom) to the database
 * @param study The completed study data
 * @param athleteId The athlete's ID
 * @returns Object with success status, result ID, and any error
 */
export const addBasicResult = async (
  study: CompletedStudy,
  athleteId: string
) => {
  try {
    // Check that the result is of the expected type
    const result = study.results;
    if (
      result.type !== "cmj" &&
      result.type !== "squatJump" &&
      result.type !== "abalakov" &&
      result.type !== "custom"
    ) {
      throw new Error(`Invalid basic result type: ${result.type}`);
    }

    // 1. Create base_result
    const { baseResultId, error: baseResultError } = await createBaseResult(
      athleteId,
      result.takeoffFoot,
      result.sensitivity
    );

    if (baseResultError) throw baseResultError;

    // 2. Create basic_result
    const basicResultId = uuidv4();
    const currentTimestamp = new Date().toISOString();

    const { error: basicResultError } = await supabase
      .from("basic_result")
      .insert({
        id: basicResultId,
        created_at: currentTimestamp,
        last_changed: currentTimestamp,
        type: result.type,
        load: result.load,
        loadunit: result.loadUnit,
        base_result_id: baseResultId,
        bosco_result_id: null, // Not part of a Bosco test
      });

    if (basicResultError) throw basicResultError;

    // 3. Create jump_time records
    const { error: jumpTimeError } = await createJumpTimes(
      baseResultId,
      result.times
    );

    if (jumpTimeError) throw jumpTimeError;

    return {
      success: true,
      resultId: basicResultId,
      baseResultId,
    };
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
 * @returns Object with success status, result ID, and any error
 */
export const addBoscoResult = async (
  study: CompletedStudy,
  athleteId: string
) => {
  try {
    // Check that the result is of the expected type
    const result = study.results as BoscoResult;
    if (result.type !== "bosco") {
      throw new Error(`Invalid result type for Bosco test: ${result.type}`);
    }

    const currentTimestamp = new Date().toISOString();

    // 1. Create bosco_result
    const boscoResultId = uuidv4();

    const { error: boscoResultError } = await supabase
      .from("bosco_result")
      .insert({
        id: boscoResultId,
        created_at: currentTimestamp,
        last_changed: currentTimestamp,
        athlete_id: athleteId,
      });

    if (boscoResultError) throw boscoResultError;

    // 2. Create the individual test results (cmj, squatJump, abalakov)
    const tests = [
      { type: "cmj", data: result.cmj },
      { type: "squatJump", data: result.squatJump },
      { type: "abalakov", data: result.abalakov },
    ];

    for (const test of tests) {
      // 2a. Create base_result for each test
      const { baseResultId, error: baseResultError } = await createBaseResult(
        athleteId,
        test.data.takeoffFoot,
        test.data.sensitivity
      );

      if (baseResultError) throw baseResultError;

      // 2b. Create basic_result for each test
      const basicResultId = uuidv4();

      const { error: basicResultError } = await supabase
        .from("basic_result")
        .insert({
          id: basicResultId,
          created_at: currentTimestamp,
          last_changed: currentTimestamp,
          type: test.type,
          load: test.data.load,
          loadunit: test.data.loadUnit,
          base_result_id: baseResultId,
          bosco_result_id: boscoResultId, // Link to the bosco_result
        });

      if (basicResultError) throw basicResultError;

      // 2c. Create jump_time records for each test
      const { error: jumpTimeError } = await createJumpTimes(
        baseResultId,
        test.data.times
      );

      if (jumpTimeError) throw jumpTimeError;
    }

    return {
      success: true,
      resultId: boscoResultId,
    };
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
 * @returns Object with success status, result ID, and any error
 */
export const addMultipleJumpsResult = async (
  study: CompletedStudy,
  athleteId: string
) => {
  try {
    // Check that the result is of the expected type
    const result = study.results as MultipleJumpsResult;
    if (result.type !== "multipleJumps") {
      throw new Error(`Invalid result type for Multiple Jumps: ${result.type}`);
    }

    // 1. Create base_result
    const { baseResultId, error: baseResultError } = await createBaseResult(
      athleteId,
      result.takeoffFoot,
      result.sensitivity
    );

    if (baseResultError) throw baseResultError;

    // 2. Create multiple_jumps_result
    const multipleJumpsResultId = uuidv4();
    const currentTimestamp = new Date().toISOString();

    const { error: multipleJumpsResultError } = await supabase
      .from("multiple_jumps_result")
      .insert({
        id: multipleJumpsResultId,
        created_at: currentTimestamp,
        last_changed: currentTimestamp,
        criteria: result.criteria,
        criteria_value: result.criteriaValue,
        base_result_id: baseResultId,
      });

    if (multipleJumpsResultError) throw multipleJumpsResultError;

    // 3. Create jump_time records
    const { error: jumpTimeError } = await createJumpTimes(
      baseResultId,
      result.times
    );

    if (jumpTimeError) throw jumpTimeError;

    return {
      success: true,
      resultId: multipleJumpsResultId,
      baseResultId,
    };
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
 * @returns Object with success status, result ID, and any error
 */
export const addMultipleDropJumpResult = async (
  study: CompletedStudy,
  athleteId: string
) => {
  try {
    // Check that the result is of the expected type
    const result = study.results as MultipleDropJumpResult;
    if (result.type !== "multipleDropJump") {
      throw new Error(
        `Invalid result type for Multiple Drop Jump: ${result.type}`
      );
    }

    const currentTimestamp = new Date().toISOString();

    // 1. Create multiple_drop_jump_result
    const multipleDropJumpId = uuidv4();

    const { error: multipleDropJumpError } = await supabase
      .from("multiple_drop_jump_result")
      .insert({
        id: multipleDropJumpId,
        created_at: currentTimestamp,
        last_changed: currentTimestamp,
        height_unit: result.heightUnit,
        takeoff_foot: result.takeoffFoot,
        best_height: result.bestHeight,
        athlete_id: athleteId,
      });

    if (multipleDropJumpError) throw multipleDropJumpError;

    // 2. Create individual drop jump results
    for (const dropJump of result.dropJumps) {
      // 2a. Create base_result for each drop jump
      const { baseResultId, error: baseResultError } = await createBaseResult(
        athleteId,
        dropJump.takeoffFoot,
        dropJump.sensitivity
      );

      if (baseResultError) throw baseResultError;

      // 2b. Create drop_jump_result for each drop jump
      const dropJumpResultId = uuidv4();

      const { error: dropJumpResultError } = await supabase
        .from("drop_jump_result")
        .insert({
          id: dropJumpResultId,
          created_at: currentTimestamp,
          last_changed: currentTimestamp,
          height: dropJump.height,
          stiffness: dropJump.stiffness,
          base_result_id: baseResultId,
          multiple_drop_jump_id: multipleDropJumpId, // Link to the multiple_drop_jump_result
        });

      if (dropJumpResultError) throw dropJumpResultError;

      // 2c. Create jump_time records for each drop jump
      const { error: jumpTimeError } = await createJumpTimes(
        baseResultId,
        dropJump.times
      );

      if (jumpTimeError) throw jumpTimeError;
    }

    return {
      success: true,
      resultId: multipleDropJumpId,
    };
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
 * @returns Object with success status, result ID, and any error
 */
export const addResult = async (study: CompletedStudy, athleteId: string) => {
  try {
    const resultType = study.results.type;

    switch (resultType) {
      case "bosco":
        return await addBoscoResult(study, athleteId);

      case "multipleDropJump":
        return await addMultipleDropJumpResult(study, athleteId);

      case "multipleJumps":
        return await addMultipleJumpsResult(study, athleteId);

      case "cmj":
      case "squatJump":
      case "abalakov":
      case "custom":
        return await addBasicResult(study, athleteId);

      default:
        return {
          success: false,
          error: `Unsupported study type: ${resultType}`,
        };
    }
  } catch (error) {
    console.error(`Error adding result:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
