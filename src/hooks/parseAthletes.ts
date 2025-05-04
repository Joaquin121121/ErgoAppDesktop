import Database from "@tauri-apps/plugin-sql";
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

interface RawBaseResult {
  id: number;
  takeoff_foot: "right" | "left" | "both";
  sensitivity: number;
  created_at: string;
  athlete_id: string;
}

interface RawBasicResult {
  id: number;
  type: "cmj" | "abalakov" | "squatJump" | "custom";
  load: number;
  loadunit: LoadUnit;
  base_result_id: number;
  bosco_result_id: number | null;
}

interface RawDropJumpResult {
  id: number;
  height: string;
  stiffness: number;
  base_result_id: number;
}

interface RawMultipleJumpsResult {
  id: number;
  criteria: "numberOfJumps" | "stiffness" | "time";
  criteria_value: number | null;
  base_result_id: number;
}

interface RawMultipleDropJumpResult {
  id: number;
  height_unit: "cm" | "ft";
  takeoff_foot: "right" | "left" | "both";
  best_height: string;
  athlete_id: string;
}

interface RawBoscoResult {
  id: number;
  athlete_id: string;
}

interface RawJumpTime {
  id: number;
  base_result_id: number;
  index: number;
  time: number;
  deleted_at: string | null;
  floor_time: number | null;
  stiffness: number | null;
  performance: number | null;
}

type LoadUnit = "kgs" | "lbs";
type HeightUnit = "cm" | "ft";

const getAthletes = async (): Promise<Athlete[]> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    // 1. First fetch all athletes
    const athletes = await db.select(
      "SELECT * FROM athlete WHERE deleted_at IS NULL"
    );

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

    // Create a map of base_results
    const baseResultMap = new Map<number, RawBaseResult>();
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
    const jumpTimeMap = new Map<number, RawJumpTime[]>();
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
        studyInfo: studyInfoLookup.multipleJumps,
        date: new Date(baseResult.created_at),
        results: multipleJumpsResult,
      };

      athlete.completedStudies.push(completedStudy);
    }

    // 7. Process drop_jump_result
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

    // 8. Process multiple_drop_jump_result
    const multipleDropJumpResults = await db.select(`
      SELECT mdjr.*, 
             GROUP_CONCAT(djr.height) as heights,
             GROUP_CONCAT(djr.id) as drop_jump_ids
      FROM multiple_drop_jump_result mdjr
      LEFT JOIN drop_jump_result djr ON djr.base_result_id IN (
        SELECT br.id FROM base_result br WHERE br.athlete_id = mdjr.athlete_id
      )
      WHERE mdjr.deleted_at IS NULL
      GROUP BY mdjr.id
    `);

    for (const mdjResult of multipleDropJumpResults) {
      const athleteId = mdjResult.athlete_id;
      const athlete = athletesMap.get(athleteId);
      if (!athlete) continue;

      // Find associated drop jump results
      const dropJumpIds = mdjResult.drop_jump_ids
        ? mdjResult.drop_jump_ids.split(",").map(Number)
        : [];

      const heights = mdjResult.heights ? mdjResult.heights.split(",") : [];

      // This is a simplification - in a real scenario we'd need to match each dropJumpResult
      // with its corresponding base_result and jump_times
      const dropJumps: DropJumpResult[] = dropJumpIds.map((_, index) => ({
        type: "dropJump",
        times: [],
        avgFlightTime: 0,
        avgHeightReached: 0,
        takeoffFoot: mdjResult.takeoff_foot,
        sensitivity: 100, // Default value, would need to come from base_result
        height: heights[index] || "0",
        stiffness: 0, // Would need to come from the actual drop_jump_result
      }));

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
        studyInfo: studyInfoLookup.multipleDropJump,
        date: new Date(), // Would need the actual date from somewhere
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
          studyInfo: studyInfoLookup.bosco,
          date: new Date(), // Would need the actual created_at from bosco_result
          results: boscoStudyResult,
        };

        athlete.completedStudies.push(completedStudy);
      }
    }

    // Convert map to array and return
    return Array.from(athletesMap.values());
  } catch (error) {
    console.error(error);
    return [];
  }
};

export default getAthletes;
