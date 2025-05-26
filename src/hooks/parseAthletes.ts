import Database from "@tauri-apps/plugin-sql";
import { v4 as uuidv4 } from "uuid";
import { Athlete, transformToAthlete } from "../types/Athletes";
import {
  CompletedStudy,
  CMJResult,
  SquatJumpResult,
  AbalakovResult,
  CustomStudyResult,
  DropJumpResult,
  MultipleDropJumpResult,
  BoscoResult,
  MultipleJumpsResult,
  BaseResult,
  JumpTime,
  studyInfoLookup,
} from "../types/Studies";
import {
  deleteBoscoResult,
  deleteMultipleDropJumpResult,
  deleteBasicResult,
  deleteMultipleJumpsResult,
} from "./parseStudies";

interface RawBaseResult {
  id: string;
  takeoff_foot: "right" | "left" | "both";
  sensitivity: number;
  created_at: string;
  athlete_id: string;
}

interface RawBasicResult {
  id: string;
  type: "cmj" | "abalakov" | "squatJump" | "custom";
  load: number;
  loadunit: LoadUnit;
  base_result_id: number;
  bosco_result_id: number | null;
}

interface RawDropJumpResult {
  id: string;
  height: string;
  stiffness: number;
  base_result_id: number;
}

interface RawMultipleJumpsResult {
  id: string;
  criteria: "numberOfJumps" | "stiffness" | "time";
  criteria_value: number | null;
  base_result_id: number;
}

interface RawMultipleDropJumpResult {
  id: string;
  height_unit: "cm" | "ft";
  takeoff_foot: "right" | "left" | "both";
  best_height: string;
  athlete_id: string;
}

interface RawBoscoResult {
  id: string;
  athlete_id: string;
}

interface RawJumpTime {
  id: string;
  base_result_id: string;
  index: number;
  time: number;
  deleted_at: string | null;
  floor_time: number | null;
  stiffness: number | null;
  performance: number | null;
}

type LoadUnit = "kgs" | "lbs";
type HeightUnit = "cm" | "ft";

const getAthletes = async (coachId: string): Promise<Athlete[]> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    // 1. First fetch all athletes with coach_id
    let query = "SELECT * FROM athlete WHERE deleted_at IS NULL";
    const queryParams = [];
    if (coachId) {
      query += " AND coach_id = ?";
      queryParams.push(coachId);
    }

    const athletes = await db.select(query, queryParams);
    // 2. Prepare athletes map with basic info, to be populated with studies later
    const athletesMap = new Map<string, Athlete>();

    athletes.forEach((athlete) => {
      const athleteObj = transformToAthlete({
        id: athlete.id,
        name: athlete.name,
        birthDate: athlete.birth_date,
        country: athlete.country,
        state: athlete.state,
        gender: athlete.gender,
        height: athlete.height,
        heightUnit: athlete.height_unit,
        weight: athlete.weight,
        weightUnit: athlete.weight_unit,
        discipline: athlete.discipline,
        category: athlete.category,
        institution: athlete.institution,
        comments: athlete.comments,
        completedStudies: [],
      });

      if (athleteObj) {
        athletesMap.set(athlete.id, athleteObj);
      }
    });

    // 3. Fetch and process base_result data with jump_time
    const baseResults = await db.select(`
      SELECT br.* 
      FROM base_result br
      WHERE br.deleted_at IS NULL
    `);

    const relevantResults = baseResults.filter((br: RawBaseResult) => {
      return br.athlete_id === "f48c9a39-4b15-46ba-9660-ce039bb69d6a";
    });
    console.log(relevantResults);

    // Create a map of base_results
    const baseResultMap = new Map<string, RawBaseResult>();
    baseResults.forEach((br: RawBaseResult) => {
      baseResultMap.set(br.id, br);
    });

    // 4. Fetch jump times for all base results
    const jumpTimes = await db.select(`
      SELECT jt.* 
      FROM jump_time jt
      -- Fetch all records, including deleted ones
      ORDER BY jt.base_result_id, jt."index"
    `);

    // Organize jump times by base_result_id
    const jumpTimeMap = new Map<string, RawJumpTime[]>();
    jumpTimes.forEach((jt: RawJumpTime) => {
      if (!jumpTimeMap.has(jt.base_result_id)) {
        jumpTimeMap.set(jt.base_result_id, []);
      }
      jumpTimeMap.get(jt.base_result_id)?.push(jt);
    });

    // 5. Fetch basic_result data (CMJ, Abalakov, SquatJump, Custom)
    const basicResults = await db.select(`
      SELECT br.* 
      FROM basic_result br
      WHERE br.deleted_at IS NULL
      AND br.bosco_result_id IS NULL
    `);

    // Process basic results and add to athlete completed studies
    for (const basicResult of basicResults) {
      const baseResult = baseResultMap.get(basicResult.base_result_id);
      if (!baseResult) continue;

      const athleteId = baseResult.athlete_id;
      const athlete = athletesMap.get(athleteId);
      if (!athlete) continue;

      const jumpTimesForResult = jumpTimeMap.get(baseResult.id) || [];

      // Process jump times
      const processedTimes: JumpTime[] = jumpTimesForResult.map((jt) => ({
        time: jt.time,
        deleted: jt.deleted_at !== null,
        floorTime: jt.floor_time ?? undefined,
        stiffness: jt.stiffness ?? undefined,
        performance: jt.performance ?? undefined,
        baseResultId: baseResult.id,
      }));

      // Calculate averages
      const validTimes = processedTimes.filter((t) => !t.deleted);
      const avgFlightTime =
        validTimes.length > 0
          ? validTimes.reduce((sum, t) => sum + t.time, 0) / validTimes.length
          : 0;

      // Height calculation (simplified formula)
      const avgHeightReached =
        avgFlightTime > 0 ? (9.81 * Math.pow(avgFlightTime, 2) * 100) / 8 : 0;

      // Create different result types based on basic_result.type
      let studyResult:
        | CMJResult
        | SquatJumpResult
        | AbalakovResult
        | CustomStudyResult;

      const baseStudyResult: BaseResult = {
        times: processedTimes,
        avgFlightTime,
        avgHeightReached,
        takeoffFoot: baseResult.takeoff_foot,
        sensitivity: baseResult.sensitivity,
      };

      switch (basicResult.type) {
        case "cmj":
          studyResult = {
            ...baseStudyResult,
            type: "cmj",
            load: basicResult.load,
            loadUnit: basicResult.loadunit,
          };
          break;
        case "abalakov":
          studyResult = {
            ...baseStudyResult,
            type: "abalakov",
            load: basicResult.load,
            loadUnit: basicResult.loadunit,
          };
          break;
        case "squatJump":
          studyResult = {
            ...baseStudyResult,
            type: "squatJump",
            load: basicResult.load,
            loadUnit: basicResult.loadunit,
          };
          break;
        default: // 'custom'
          studyResult = {
            ...baseStudyResult,
            type: "custom",
            load: basicResult.load,
            loadUnit: basicResult.loadunit,
          };
      }

      // Push to athlete's completedStudies
      const completedStudy: CompletedStudy = {
        id: basicResult.id,
        studyInfo:
          studyInfoLookup[
            basicResult.type === "custom" ? "cmj" : basicResult.type
          ],
        date: new Date(baseResult.created_at),
        results: studyResult,
      };

      athlete.completedStudies.push(completedStudy);

      // Handle bosco results separately if this is part of a bosco test
      if (basicResult.bosco_result_id) {
        // We'll process bosco results in step 7
      }
    }

    // 6. Process multiple_jumps_result
    const multipleJumpsResults = await db.select(`
      SELECT mjr.* 
      FROM multiple_jumps_result mjr
      WHERE mjr.deleted_at IS NULL
    `);

    for (const mjResult of multipleJumpsResults) {
      const baseResult = baseResultMap.get(mjResult.base_result_id);
      if (!baseResult) continue;

      const athleteId = baseResult.athlete_id;
      const athlete = athletesMap.get(athleteId);
      if (!athlete) continue;

      const jumpTimesForResult = jumpTimeMap.get(baseResult.id) || [];

      // Process jump times
      const processedTimes: JumpTime[] = jumpTimesForResult.map((jt) => ({
        id: jt.id,
        time: jt.time,
        deleted: jt.deleted_at !== null,
        floorTime: jt.floor_time ?? undefined,
        stiffness: jt.stiffness ?? undefined,
        performance: jt.performance ?? undefined,
        baseResultId: baseResult.id,
      }));

      // Calculate averages
      const validTimes = processedTimes.filter((t) => !t.deleted);
      const avgFlightTime =
        validTimes.length > 0
          ? validTimes.reduce((sum, t) => sum + t.time, 0) / validTimes.length
          : 0;

      const avgHeightReached =
        avgFlightTime > 0 ? (9.81 * Math.pow(avgFlightTime, 2) * 100) / 8 : 0;

      const avgFloorTime =
        validTimes.length > 0 && validTimes[0].floorTime
          ? validTimes.reduce((sum, t) => sum + (t.floorTime || 0), 0) /
            validTimes.length
          : 0;

      const stiffnessValues = validTimes
        .map((t) => t.stiffness)
        .filter((s): s is number => s !== undefined);

      const performanceValues = validTimes
        .map((t) => t.performance)
        .filter((p): p is number => p !== undefined);

      const avgStiffness =
        stiffnessValues.length > 0
          ? stiffnessValues.reduce((sum, s) => sum + s, 0) /
            stiffnessValues.length
          : 0;

      const avgPerformance =
        performanceValues.length > 0
          ? performanceValues.reduce((sum, p) => sum + p, 0) /
            performanceValues.length
          : 0;

      // Simple performance drop calculation (first jump vs average)
      const performanceDrop =
        performanceValues.length > 1 && performanceValues[0] > 0
          ? ((performanceValues[0] - avgPerformance) / performanceValues[0]) *
            100
          : 0;

      const multipleJumpsResult: MultipleJumpsResult = {
        type: "multipleJumps",
        times: processedTimes,
        avgFlightTime,
        avgHeightReached,
        takeoffFoot: baseResult.takeoff_foot,
        sensitivity: baseResult.sensitivity,
        criteria: mjResult.criteria,
        criteriaValue: mjResult.criteria_value,
        avgFloorTime,
        stiffness: stiffnessValues,
        performance: performanceValues,
        avgStiffness,
        avgPerformance,
        performanceDrop,
      };

      // Push to athlete's completedStudies
      const completedStudy: CompletedStudy = {
        id: mjResult.id,
        studyInfo: studyInfoLookup.multipleJumps,
        date: new Date(baseResult.created_at),
        results: multipleJumpsResult,
      };

      athlete.completedStudies.push(completedStudy);
    }

    // 7. Process drop_jump_result
    /* --> Comment out this entire block as DropJumpResult should only exist within MultipleDropJumpResult
    const dropJumpResults = await db.select(`
      SELECT djr.* 
      FROM drop_jump_result djr
      WHERE djr.deleted_at IS NULL
    `);

    for (const djResult of dropJumpResults) {
      const baseResult = baseResultMap.get(djResult.base_result_id);
      if (!baseResult) continue;

      const athleteId = baseResult.athlete_id;
      const athlete = athletesMap.get(athleteId);
      if (!athlete) continue;

      const jumpTimesForResult = jumpTimeMap.get(baseResult.id) || [];

      // Process jump times
      const processedTimes: JumpTime[] = jumpTimesForResult.map((jt) => ({
        time: jt.time,
        deleted: jt.deleted_at !== null,
        floorTime: jt.floor_time ?? undefined,
        stiffness: jt.stiffness ?? undefined,
        performance: jt.performance ?? undefined,
      }));

      // Calculate averages
      const validTimes = processedTimes.filter((t) => !t.deleted);
      const avgFlightTime =
        validTimes.length > 0
          ? validTimes.reduce((sum, t) => sum + t.time, 0) / validTimes.length
          : 0;

      const avgHeightReached =
        avgFlightTime > 0 ? (9.81 * Math.pow(avgFlightTime, 2) * 100) / 8 : 0;

      const dropJumpResult: DropJumpResult = {
        type: "dropJump",
        times: processedTimes,
        avgFlightTime,
        avgHeightReached,
        takeoffFoot: baseResult.takeoff_foot,
        sensitivity: baseResult.sensitivity,
        height: djResult.height,
        stiffness: djResult.stiffness,
      };

      // Push to athlete's completedStudies
      const completedStudy: CompletedStudy = {
        studyInfo: studyInfoLookup.multipleDropJump,
        date: new Date(baseResult.created_at),
        results: dropJumpResult as any, // Type assertion to bypass type check temporarily
      };

      athlete.completedStudies.push(completedStudy);
    }
    */ // <-- End of commented out block

    // 8. Process multiple_drop_jump_result
    const multipleDropJumpResults = await db.select(`
      SELECT mdjr.* 
      FROM multiple_drop_jump_result mdjr
      WHERE mdjr.deleted_at IS NULL
    `);

    for (const mdjResult of multipleDropJumpResults) {
      const athleteId = mdjResult.athlete_id;
      const athlete = athletesMap.get(athleteId);
      if (!athlete) continue;

      // Find associated drop jump results
      const dropJumpResults = await db.select(
        `
        SELECT djr.* 
        FROM drop_jump_result djr
        WHERE djr.multiple_drop_jump_id = ? AND djr.deleted_at IS NULL
      `,
        [mdjResult.id]
      );

      const dropJumps: DropJumpResult[] = [];

      for (const djResult of dropJumpResults) {
        const baseResult = baseResultMap.get(djResult.base_result_id);
        if (!baseResult) continue;

        const jumpTimesForResult = jumpTimeMap.get(baseResult.id) || [];

        // Process jump times
        const processedTimes: JumpTime[] = jumpTimesForResult.map((jt) => ({
          id: jt.id,
          time: jt.time,
          deleted: jt.deleted_at !== null,
          floorTime: jt.floor_time ?? undefined,
          stiffness: jt.stiffness ?? undefined,
          performance: jt.performance ?? undefined,
          baseResultId: baseResult.id,
        }));

        // Calculate averages
        const validTimes = processedTimes.filter((t) => !t.deleted);
        const avgFlightTime =
          validTimes.length > 0
            ? validTimes.reduce((sum, t) => sum + t.time, 0) / validTimes.length
            : 0;

        const avgHeightReached =
          avgFlightTime > 0 ? (9.81 * Math.pow(avgFlightTime, 2) * 100) / 8 : 0;

        const dropJumpResult: DropJumpResult = {
          type: "dropJump",
          times: processedTimes,
          avgFlightTime,
          avgHeightReached,
          takeoffFoot: baseResult.takeoff_foot,
          sensitivity: baseResult.sensitivity,
          height: djResult.height,
          stiffness: djResult.stiffness,
        };

        dropJumps.push(dropJumpResult);
      }

      const multipleDropJumpResult: MultipleDropJumpResult = {
        type: "multipleDropJump",
        dropJumps,
        heightUnit: mdjResult.height_unit,
        maxAvgHeightReached: Math.max(
          ...dropJumps.map((dj) => dj.avgHeightReached),
          0
        ),
        takeoffFoot: mdjResult.takeoff_foot,
        bestHeight: mdjResult.best_height,
      };

      // Push to athlete's completedStudies
      const completedStudy: CompletedStudy = {
        id: mdjResult.id,
        studyInfo: studyInfoLookup.multipleDropJump,
        date: new Date(mdjResult.created_at),
        results: multipleDropJumpResult,
      };

      athlete.completedStudies.push(completedStudy);
    }

    // 9. Process bosco_result
    const boscoResults = await db.select(`
      SELECT br.*
      FROM bosco_result br
      WHERE br.deleted_at IS NULL
    `);

    for (const boscoResult of boscoResults) {
      const athleteId = boscoResult.athlete_id;
      const athlete = athletesMap.get(athleteId);
      if (!athlete) continue;

      // Find the basic results linked to this bosco result
      const linkedBasicResults = await db.select(
        `
        SELECT br.* 
        FROM basic_result br
        WHERE br.bosco_result_id = ? AND br.deleted_at IS NULL
      `,
        [boscoResult.id]
      );

      // We need one of each type
      let cmjResult: CMJResult | null = null;
      let squatJumpResult: SquatJumpResult | null = null;
      let abalakovResult: AbalakovResult | null = null;

      // For each basic result, find its base_result and jump_times
      for (const basicResult of linkedBasicResults) {
        const baseResult = baseResultMap.get(basicResult.base_result_id);
        if (!baseResult) continue;

        const jumpTimesForResult = jumpTimeMap.get(baseResult.id) || [];

        // Process jump times
        const processedTimes: JumpTime[] = jumpTimesForResult.map((jt) => ({
          id: jt.id,
          time: jt.time,
          deleted: jt.deleted_at !== null,
          floorTime: jt.floor_time ?? undefined,
          stiffness: jt.stiffness ?? undefined,
          performance: jt.performance ?? undefined,
          baseResultId: baseResult.id,
        }));

        // Calculate averages
        const validTimes = processedTimes.filter((t) => !t.deleted);
        const avgFlightTime =
          validTimes.length > 0
            ? validTimes.reduce((sum, t) => sum + t.time, 0) / validTimes.length
            : 0;

        const avgHeightReached =
          avgFlightTime > 0 ? (9.81 * Math.pow(avgFlightTime, 2) * 100) / 8 : 0;

        const baseStudyResult: BaseResult = {
          times: processedTimes,
          avgFlightTime,
          avgHeightReached,
          takeoffFoot: baseResult.takeoff_foot,
          sensitivity: baseResult.sensitivity,
        };

        // Create appropriate result based on type
        switch (basicResult.type) {
          case "cmj":
            cmjResult = {
              ...baseStudyResult,
              type: "cmj",
              load: basicResult.load,
              loadUnit: basicResult.loadunit,
            };
            break;
          case "squatJump":
            squatJumpResult = {
              ...baseStudyResult,
              type: "squatJump",
              load: basicResult.load,
              loadUnit: basicResult.loadunit,
            };
            break;
          case "abalakov":
            abalakovResult = {
              ...baseStudyResult,
              type: "abalakov",
              load: basicResult.load,
              loadUnit: basicResult.loadunit,
            };
            break;
        }
      }

      // Only create bosco result if we have at least one component
      if (cmjResult || squatJumpResult || abalakovResult) {
        const boscoStudyResult: BoscoResult = {
          type: "bosco",
          cmj: cmjResult || {
            type: "cmj",
            times: [],
            avgFlightTime: 0,
            avgHeightReached: 0,
            takeoffFoot: "both",
            sensitivity: 100,
            load: 0,
            loadUnit: "kgs",
          },
          squatJump: squatJumpResult || {
            type: "squatJump",
            times: [],
            avgFlightTime: 0,
            avgHeightReached: 0,
            takeoffFoot: "both",
            sensitivity: 100,
            load: 0,
            loadUnit: "kgs",
          },
          abalakov: abalakovResult || {
            type: "abalakov",
            times: [],
            avgFlightTime: 0,
            avgHeightReached: 0,
            takeoffFoot: "both",
            sensitivity: 100,
            load: 0,
            loadUnit: "kgs",
          },
        };

        // Push to athlete's completedStudies
        const completedStudy: CompletedStudy = {
          id: boscoResult.id,
          studyInfo: studyInfoLookup.bosco,
          date: new Date(), // Would need the actual created_at from bosco_result
          results: boscoStudyResult,
        };

        athlete.completedStudies.push(completedStudy);
      }
    }
    console.log(athletesMap.values());
    // Convert map to array and return
    return Array.from(athletesMap.values());
  } catch (error) {
    console.error(error);
    return [];
  }
};

// Function to save or update basic athlete information
export const saveAthleteInfo = async (
  athlete: Athlete,
  coachId: string,
  externalDb?: any
): Promise<void> => {
  const completeAthlete = { ...athlete, coach_id: coachId, id: uuidv4() };
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    try {
      // Check if athlete exists
      const existingAthlete = await dbToUse.select(
        "SELECT id FROM athlete WHERE id = ?",
        [athlete.id]
      );

      const birthDateFormatted = athlete.birthDate
        ? athlete.birthDate.toISOString().split("T")[0]
        : null;

      if (existingAthlete.length > 0) {
        // Athlete exists, UPDATE
        await dbToUse.execute(
          `UPDATE athlete 
           SET name = ?, birth_date = ?, country = ?, state = ?, gender = ?, 
               height = ?, height_unit = ?, weight = ?, weight_unit = ?, 
               discipline = ?, category = ?, institution = ?, comments = ?,
               last_changed = ?,
               coach_id = ?
           WHERE id = ?`,
          [
            athlete.name,
            birthDateFormatted,
            athlete.country,
            athlete.state,
            athlete.gender,
            athlete.height,
            athlete.heightUnit,
            athlete.weight,
            athlete.weightUnit,
            athlete.discipline,
            athlete.category,
            athlete.institution,
            athlete.comments,
            new Date().toISOString(),
            coachId,
            athlete.id,
          ]
        );
      } else {
        console.log("Athlete does not exist, INSERT");
        // Athlete does not exist, INSERT
        // created_at and last_changed will be handled by DB defaults/triggers
        await dbToUse.execute(
          `INSERT INTO athlete (id, coach_id, name, birth_date, country, state, gender, 
                               height, height_unit, weight, weight_unit, 
                               discipline, category, institution, comments)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            completeAthlete.id,
            coachId,
            athlete.name,
            birthDateFormatted,
            athlete.country,
            athlete.state,
            athlete.gender,
            athlete.height,
            athlete.heightUnit,
            athlete.weight,
            athlete.weightUnit,
            athlete.discipline,
            athlete.category,
            athlete.institution,
            athlete.comments,
          ]
        );
      }

      if (isManagingTransaction) {
        await dbToUse.execute("COMMIT");
      }
    } catch (innerError) {
      if (isManagingTransaction) {
        console.error(
          "Error during save athlete info, rolling back transaction:",
          innerError
        );
        await dbToUse.execute("ROLLBACK");
      }
      throw innerError; // Re-throw error after rollback
    }
  } catch (error) {
    console.error("Failed to save athlete info:", error);
    throw error; // Re-throw to allow caller to handle
  }
};

/**
 * Saves multiple athletes to the database within a single transaction.
 * @param data An object containing an array of athletes and a coach ID.
 * @returns Object with overall success status, an array of individual operation results, and any error message if the transaction failed.
 */
export const saveAllAthletes = async (data: {
  athleteInfo: Athlete[];
  coachId: string;
}) => {
  if (!data || !data.athleteInfo || !data.coachId) {
    return {
      success: false,
      error: "Invalid input: athleteInfo array and coachId are required.",
      results: [],
    };
  }

  if (data.athleteInfo.length === 0) {
    return { success: true, results: [] }; // No operations to perform
  }

  const db = await (Database as any).load("sqlite:ergolab.db");
  try {
    await db.execute("BEGIN TRANSACTION");

    const operationResults = [];
    for (let i = 0; i < data.athleteInfo.length; i++) {
      const athlete = data.athleteInfo[i];

      // Log which athlete is being processed
      console.log(
        `Processing athlete ${i + 1}/${data.athleteInfo.length}: ${
          athlete.name
        }`
      );

      try {
        await saveAthleteInfo(athlete, data.coachId, db); // Pass the db instance
        operationResults.push({ success: true, athleteId: athlete.id });
      } catch (error) {
        console.error(
          `Failed to save athlete ${i} (${athlete.name}). Error: ${error}. Rolling back.`
        );
        await db.execute("ROLLBACK");
        return {
          success: false,
          error: `Failed to save athlete ${i} (${athlete.name}): ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          results: operationResults,
        };
      }
    }

    await db.execute("COMMIT");
    console.log("Successfully saved all athletes. Transaction committed.");
    return { success: true, results: operationResults };
  } catch (error) {
    console.error(
      "Critical error during multiple athletes save, attempting rollback:",
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
          : "Unknown critical error occurred during multiple athletes save.",
      results: [],
    };
  }
};

// Function to soft delete an athlete by ID
export const deleteAthlete = async (athleteId: string): Promise<void> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");
    console.log(athleteId);
    // Use transaction for atomicity
    await db.execute("BEGIN TRANSACTION");

    try {
      // 1. Get all bosco_result IDs for this athlete
      const boscoResults = await db.select(
        "SELECT id FROM bosco_result WHERE athlete_id = ? AND deleted_at IS NULL",
        [athleteId]
      );

      // Delete all bosco results
      for (const boscoResult of boscoResults) {
        const result = await deleteBoscoResult(boscoResult.id, db);
        if (!result.success) {
          throw new Error(`Failed to delete bosco result: ${result.error}`);
        }
      }

      // 2. Get all multiple_drop_jump_result IDs for this athlete
      const multipleDropJumpResults = await db.select(
        "SELECT id FROM multiple_drop_jump_result WHERE athlete_id = ? AND deleted_at IS NULL",
        [athleteId]
      );

      // Delete all multiple drop jump results
      for (const multipleDropJumpResult of multipleDropJumpResults) {
        const result = await deleteMultipleDropJumpResult(
          multipleDropJumpResult.id,
          db
        );
        if (!result.success) {
          throw new Error(
            `Failed to delete multiple drop jump result: ${result.error}`
          );
        }
      }

      // 3. Get all basic_result IDs for this athlete (excluding those that are part of bosco results)
      const basicResults = await db.select(
        `SELECT br.id FROM basic_result br 
         JOIN base_result base ON br.base_result_id = base.id 
         WHERE base.athlete_id = ? AND br.deleted_at IS NULL AND br.bosco_result_id IS NULL`,
        [athleteId]
      );

      // Delete all basic results
      for (const basicResult of basicResults) {
        const result = await deleteBasicResult(basicResult.id, db);
        if (!result.success) {
          throw new Error(`Failed to delete basic result: ${result.error}`);
        }
      }

      // 4. Get all multiple_jumps_result IDs for this athlete
      const multipleJumpsResults = await db.select(
        `SELECT mjr.id FROM multiple_jumps_result mjr 
         JOIN base_result base ON mjr.base_result_id = base.id 
         WHERE base.athlete_id = ? AND mjr.deleted_at IS NULL`,
        [athleteId]
      );

      // Delete all multiple jumps results
      for (const multipleJumpsResult of multipleJumpsResults) {
        const result = await deleteMultipleJumpsResult(
          multipleJumpsResult.id,
          db
        );
        if (!result.success) {
          throw new Error(
            `Failed to delete multiple jumps result: ${result.error}`
          );
        }
      }

      // 5. Finally, soft delete the athlete
      const now = new Date().toISOString();
      await db.execute(
        "UPDATE athlete SET deleted_at = ?, last_changed = ? WHERE id = ?",
        [now, now, athleteId]
      );

      // Commit transaction
      await db.execute("COMMIT");
    } catch (innerError) {
      // Rollback transaction on error
      console.error(
        "Error during delete athlete, rolling back transaction:",
        innerError
      );
      await db.execute("ROLLBACK");
      throw innerError; // Re-throw error after rollback
    }
  } catch (error) {
    console.error("Failed to delete athlete:", error);
    throw error; // Re-throw to allow caller to handle
  }
};

export default getAthletes;
