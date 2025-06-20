import { Athlete, transformToAthlete } from "../types/Athletes";
import Database from "@tauri-apps/plugin-sql";
import { DbBaseResult, DbJumpTime } from "../dbtypes/Tests";
import {
  CMJResult,
  SquatJumpResult,
  AbalakovResult,
  CustomStudyResult,
  BaseResult,
  JumpTime,
  CompletedStudy,
  studyInfoLookup,
  MultipleJumpsResult,
  DropJumpResult,
  MultipleDropJumpResult,
  BoscoResult,
} from "../types/Studies";
import { v4 as uuidv4 } from "uuid";
import { PendingRecord } from "@/types/Sync";

const calculateAverages = (jumpTimes: JumpTime[]) => {
  const validTimes = jumpTimes.filter((t) => !t.deleted);
  let avgFloorTime = 0;
  let avgStiffness = 0;
  let avgPerformance = 0;
  let performanceDrop = 0;
  const avgFlightTime =
    validTimes.length > 0
      ? validTimes.reduce((sum, t) => sum + t.time, 0) / validTimes.length
      : 0;
  const avgHeightReached =
    avgFlightTime > 0 ? (9.81 * avgFlightTime ** 2 * 100) / 8 : 0;
  if (validTimes.some((t) => t.floorTime)) {
    avgFloorTime =
      validTimes.reduce((sum, t) => sum + t.floorTime, 0) / validTimes.length;
  }
  if (validTimes.some((t) => t.stiffness)) {
    avgStiffness =
      validTimes.reduce((sum, t) => sum + t.stiffness, 0) / validTimes.length;
  }
  if (validTimes.some((t) => t.performance)) {
    avgPerformance =
      validTimes.reduce((sum, t) => sum + t.performance, 0) / validTimes.length;
    performanceDrop =
      ((Math.max(...validTimes.map((t) => t.performance || 0)) -
        avgPerformance) /
        Math.max(...validTimes.map((t) => t.performance || 0))) *
      100;
  }
  return {
    avgFlightTime,
    avgHeightReached,
    avgFloorTime,
    avgStiffness,
    avgPerformance,
    performanceDrop,
  };
};

const processBasicResults = async (
  db: any,
  baseResultMap: Map<string, DbBaseResult>,
  jumpTimeMap: Map<string, DbJumpTime[]>,
  athletesMap: Map<string, Athlete>
) => {
  const basicResults = await db.select(`
      SELECT br.* 
      FROM basic_result br
      WHERE br.deleted_at IS NULL
      AND br.bosco_result_id IS NULL
    `);
  for (const basicResult of basicResults) {
    const baseResult = baseResultMap.get(basicResult.base_result_id);
    if (!baseResult) continue;

    const athleteId = baseResult.athlete_id;
    const athlete = athletesMap.get(athleteId);
    if (!athlete) continue;

    const jumpTimesForResult = jumpTimeMap.get(baseResult.id) || [];

    const processedTimes: JumpTime[] = jumpTimesForResult.map((jt) => ({
      time: jt.time,
      deleted: jt.deleted,
      performance: jt.performance ?? undefined,
      baseResultId: baseResult.id,
    }));

    const { avgFlightTime, avgHeightReached, avgPerformance, performanceDrop } =
      calculateAverages(processedTimes);

    let studyResult:
      | CMJResult
      | SquatJumpResult
      | AbalakovResult
      | CustomStudyResult;

    const baseStudyResult: BaseResult = {
      times: processedTimes,
      avgFlightTime,
      avgHeightReached,
      avgPerformance,
      performanceDrop,
      takeoffFoot: baseResult.takeoff_foot as "right" | "left" | "both",
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
  }
  return athletesMap;
};

const processMultipleJumpsResults = async (
  db: any,
  baseResultMap: Map<string, DbBaseResult>,
  jumpTimeMap: Map<string, DbJumpTime[]>,
  athletesMap: Map<string, Athlete>
) => {
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

    const processedTimes: JumpTime[] = jumpTimesForResult.map((jt) => ({
      id: jt.id,
      time: jt.time,
      deleted: jt.deleted,
      floorTime: jt.floor_time,
      stiffness: jt.stiffness,
      performance: jt.performance,
      baseResultId: baseResult.id,
    }));

    const {
      avgFlightTime,
      avgHeightReached,
      avgFloorTime,
      avgStiffness,
      avgPerformance,
      performanceDrop,
    } = calculateAverages(processedTimes);

    const multipleJumpsResult: MultipleJumpsResult = {
      type: "multipleJumps",
      times: processedTimes,
      avgFlightTime,
      avgHeightReached,
      takeoffFoot: baseResult.takeoff_foot as "right" | "left" | "both",
      sensitivity: baseResult.sensitivity,
      criteria: mjResult.criteria,
      criteriaValue: mjResult.criteria_value,
      avgFloorTime,
      avgStiffness,
      avgPerformance,
      performanceDrop,
    };

    const completedStudy: CompletedStudy = {
      id: mjResult.id,
      studyInfo: studyInfoLookup.multipleJumps,
      date: new Date(baseResult.created_at),
      results: multipleJumpsResult,
    };

    athlete.completedStudies.push(completedStudy);
  }
  return athletesMap;
};

const processMultipleDropJumpResults = async (
  db: any,
  baseResultMap: Map<string, DbBaseResult>,
  jumpTimeMap: Map<string, DbJumpTime[]>,
  athletesMap: Map<string, Athlete>
) => {
  const multipleDropJumpResults = await db.select(`
      SELECT mdjr.* 
      FROM multiple_drop_jump_result mdjr
      WHERE mdjr.deleted_at IS NULL
    `);

  for (const mdjResult of multipleDropJumpResults) {
    const athleteId = mdjResult.athlete_id;
    const athlete = athletesMap.get(athleteId);
    if (!athlete) continue;

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

      const processedTimes: JumpTime[] = jumpTimesForResult.map((jt) => ({
        id: jt.id,
        time: jt.time,
        deleted: jt.deleted,
        floorTime: jt.floor_time,
        stiffness: jt.stiffness,
        performance: jt.performance ?? undefined,
        baseResultId: baseResult.id,
      }));

      const {
        avgFlightTime,
        avgHeightReached,
        avgFloorTime,
        avgStiffness,
        avgPerformance,
        performanceDrop,
      } = calculateAverages(processedTimes);

      const dropJumpResult: DropJumpResult = {
        type: "dropJump",
        times: processedTimes,
        avgFlightTime,
        avgHeightReached,
        takeoffFoot: baseResult.takeoff_foot as "right" | "left" | "both",
        sensitivity: baseResult.sensitivity,
        height: djResult.height,
        stiffness: djResult.stiffness,
        avgFloorTime,
        avgStiffness,
        avgPerformance,
        performanceDrop,
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
      takeoffFoot: mdjResult.takeoff_foot as "right" | "left" | "both",
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
  return athletesMap;
};

const processBoscoResults = async (
  db: any,
  baseResultMap: Map<string, DbBaseResult>,
  jumpTimeMap: Map<string, DbJumpTime[]>,
  athletesMap: Map<string, Athlete>
) => {
  const boscoResults = await db.select(`
      SELECT br.*
      FROM bosco_result br
      WHERE br.deleted_at IS NULL
    `);

  for (const boscoResult of boscoResults) {
    const athleteId = boscoResult.athlete_id;
    const athlete = athletesMap.get(athleteId);
    if (!athlete) continue;

    const linkedBasicResults = await db.select(
      `
        SELECT br.* 
        FROM basic_result br
        WHERE br.bosco_result_id = ? AND br.deleted_at IS NULL
      `,
      [boscoResult.id]
    );
    if (linkedBasicResults.length !== 3) continue;

    let cmjResult: CMJResult | null = null;
    let squatJumpResult: SquatJumpResult | null = null;
    let abalakovResult: AbalakovResult | null = null;

    for (const basicResult of linkedBasicResults) {
      const baseResult = baseResultMap.get(basicResult.base_result_id);
      if (!baseResult) continue;

      const jumpTimesForResult = jumpTimeMap.get(baseResult.id) || [];

      const processedTimes: JumpTime[] = jumpTimesForResult.map((jt) => ({
        id: jt.id,
        time: jt.time,
        deleted: jt.deleted,
        performance: jt.performance ?? undefined,
        baseResultId: baseResult.id,
      }));

      const {
        avgFlightTime,
        avgHeightReached,
        avgPerformance,
        performanceDrop,
      } = calculateAverages(processedTimes);

      const baseStudyResult: BaseResult = {
        times: processedTimes,
        avgFlightTime,
        avgHeightReached,
        avgPerformance,
        performanceDrop,
        takeoffFoot: baseResult.takeoff_foot as "right" | "left" | "both",
        sensitivity: baseResult.sensitivity,
      };

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

    if (cmjResult && squatJumpResult && abalakovResult) {
      const boscoStudyResult: BoscoResult = {
        type: "bosco",
        cmj: cmjResult,
        squatJump: squatJumpResult,
        abalakov: abalakovResult,
      };

      const completedStudy: CompletedStudy = {
        id: boscoResult.id,
        studyInfo: studyInfoLookup.bosco,
        date: new Date(boscoResult.created_at),
        results: boscoStudyResult,
      };

      athlete.completedStudies.push(completedStudy);
    }
  }
  return athletesMap;
};

export const getAthletes = async (coachId: string): Promise<Athlete[]> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    let query =
      "SELECT * FROM athlete WHERE deleted_at IS NULL AND coach_id = ?";
    const athletes = await db.select(query, [coachId]);
    if (athletes.length === 0) {
      return [];
    }
    let athletesMap = new Map<string, Athlete>();
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
    const athleteIds = Array.from(athletesMap.keys());
    const placeholders = athleteIds.map(() => "?").join(", ");

    const baseResults = await db.select(
      `SELECT br.* 
   FROM base_result br
   WHERE br.deleted_at IS NULL AND br.athlete_id IN (${placeholders})`,
      athleteIds
    );
    console.log("baseResults", baseResults);

    const baseResultMap = new Map<string, DbBaseResult>();
    baseResults.forEach((br: DbBaseResult) => {
      baseResultMap.set(br.id, br);
    });

    const jumpTimes = await db.select(`
      SELECT jt.* 
      FROM jump_time jt
      ORDER BY jt.base_result_id, jt."index"
    `);

    const jumpTimeMap = new Map<string, DbJumpTime[]>();
    jumpTimes.forEach((jt: DbJumpTime) => {
      if (!jumpTimeMap.has(jt.base_result_id)) {
        jumpTimeMap.set(jt.base_result_id, []);
      }
      jumpTimeMap.get(jt.base_result_id)?.push(jt);
    });
    athletesMap = await processBasicResults(
      db,
      baseResultMap,
      jumpTimeMap,
      athletesMap
    );
    athletesMap = await processMultipleJumpsResults(
      db,
      baseResultMap,
      jumpTimeMap,
      athletesMap
    );

    athletesMap = await processMultipleDropJumpResults(
      db,
      baseResultMap,
      jumpTimeMap,
      athletesMap
    );

    athletesMap = await processBoscoResults(
      db,
      baseResultMap,
      jumpTimeMap,
      athletesMap
    );
    return Array.from(athletesMap.values());
  } catch (error) {
    console.error(error);
    return [];
  }
};
export const saveAthleteInfo = async (
  athlete: Athlete,
  coachId: string,
  pushRecord: (records: PendingRecord[]) => Promise<void>,
  externalDb?: any
): Promise<PendingRecord> => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    try {
      const existingAthlete = await dbToUse.select(
        "SELECT id FROM athlete WHERE id = ?",
        [athlete.id]
      );

      const birthDateFormatted = athlete.birthDate
        ? athlete.birthDate.toISOString().split("T")[0]
        : null;

      if (existingAthlete.length > 0) {
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
        await dbToUse.execute(
          `INSERT INTO athlete (id, coach_id, name, birth_date, country, state, gender, 
                               height, height_unit, weight, weight_unit, 
                               discipline, category, institution, comments)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
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
        pushRecord([{ tableName: "athlete", id: athlete.id }]);
      } else {
        return { tableName: "athlete", id: athlete.id };
      }
    } catch (innerError) {
      if (isManagingTransaction) {
        console.error(
          "Error during save athlete info, rolling back transaction:",
          innerError
        );
        await dbToUse.execute("ROLLBACK");
      }
      throw innerError;
    }
  } catch (error) {
    console.error("Failed to save athlete info:", error);
    throw error;
  }
};

export const saveAllAthletes = async (
  athleteInfo: Athlete[],
  coachId: string,
  pushRecord: (records: PendingRecord[]) => Promise<void>
) => {
  if (!athleteInfo || !coachId || athleteInfo.length === 0) {
    return "error";
  }
  const db = await (Database as any).load("sqlite:ergolab.db");
  const pendingRecords: PendingRecord[] = [];
  try {
    await db.execute("BEGIN TRANSACTION");

    for (let i = 0; i < athleteInfo.length; i++) {
      const athlete = athleteInfo[i];

      try {
        const result = await saveAthleteInfo(athlete, coachId, db);
        pendingRecords.push(result);
      } catch (error) {
        await db.execute("ROLLBACK");
        return "error";
      }
    }

    await db.execute("COMMIT");
    pushRecord(pendingRecords);
    return "success";
  } catch (error) {
    console.error(error);
    try {
      await db.execute("ROLLBACK");
      console.log("ROLLBACK");
    } catch (error) {
      console.error(error);
    }
    return "error";
  }
};

export const deleteAthlete = async (
  athleteId: string,
  pushRecord: (records: PendingRecord[]) => Promise<void>
): Promise<void> => {
  try {
    const db = await (Database as any).load("sqlite:ergolab.db");

    await db.execute(`UPDATE athlete SET deleted_at = ? WHERE id = ?`, [
      new Date().toISOString(),
      athleteId,
    ]);
    pushRecord([{ tableName: "athlete", id: athleteId }]);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export default getAthletes;
