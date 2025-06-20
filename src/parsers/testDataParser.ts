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
import { PendingRecord } from "../types/Sync";
import { TableName } from "../constants/dbMetadata";

export const deleteTest = async (
  testId: string,
  studyType: StudyType,
  pushRecord: (records: PendingRecord[]) => Promise<void>,
  db?: any
) => {
  const dbToUse = db || (await (Database as any).load("sqlite:ergolab.db"));
  const now = new Date().toISOString();

  try {
    if (studyType === "bosco") {
      dbToUse.execute(
        `UPDATE bosco_result 
        SET deleted_at = ?
        WHERE id = ?`,
        [now, testId]
      );
      pushRecord([{ tableName: "bosco_result" as TableName, id: testId }]);
    } else if (studyType === "multipleDropJump") {
      dbToUse.execute(
        `UPDATE multiple_drop_jump_result 
        SET deleted_at = ?
        WHERE id = ?`,
        [now, testId]
      );
      pushRecord([
        { tableName: "multiple_drop_jump_result" as TableName, id: testId },
      ]);
    } else {
      dbToUse.execute(
        `UPDATE base_result 
        SET deleted_at = ?
        WHERE id = ?`,
        [now, testId]
      );
      pushRecord([{ tableName: "base_result" as TableName, id: testId }]);
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

    return { tableName: "base_result" as TableName, id: baseResultId };
  } catch (error) {
    console.error(error);
  }
};

const createJumpTimes = async (
  db: any,
  baseResultId: string,
  times: JumpTime[]
) => {
  try {
    const pendingRecords: PendingRecord[] = [];
    const currentTimestamp = new Date().toISOString();

    for (let index = 0; index < times.length; index++) {
      const time = times[index];
      const jumpTimeId = uuidv4();
      await db.execute(
        `INSERT INTO jump_time (id, created_at, base_result_id, "index", time, deleted, floor_time, stiffness, performance, last_changed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          jumpTimeId,
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
      pendingRecords.push({
        tableName: "jump_time" as TableName,
        id: jumpTimeId,
      });
    }
    return pendingRecords;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const addBasicResult = async (
  study: CompletedStudy,
  athleteId: string,
  pushRecord: (records: PendingRecord[]) => Promise<void>,
  externalDb?: any
) => {
  const pendingRecords: PendingRecord[] = [];
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
      const baseResultRecord = await createBaseResult(
        dbToUse,
        athleteId,
        result.takeoffFoot,
        result.sensitivity
      );
      pendingRecords.push(baseResultRecord);
      const baseResultId = baseResultRecord.id;

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
      pendingRecords.push({
        tableName: "basic_result",
        id: basicResultId,
      });

      const jumpTimeRecords = await createJumpTimes(
        dbToUse,
        baseResultId,
        result.times
      );
      pendingRecords.push(...jumpTimeRecords);

      if (isManagingTransaction) {
        await dbToUse.execute("COMMIT");
        pushRecord(pendingRecords);
        return basicResultId;
      }
      return pendingRecords;
    } catch (innerError) {
      if (isManagingTransaction) {
        await dbToUse.execute("ROLLBACK");
      }
      throw innerError;
    }
  } catch (error) {
    console.error("Error adding basic result:", error);
    return [];
  }
};

export const addBoscoResult = async (
  study: CompletedStudy,
  athleteId: string,
  pushRecord: (records: PendingRecord[]) => Promise<void>,
  externalDb?: any
) => {
  const pendingRecords: PendingRecord[] = [];
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

      pendingRecords.push({
        tableName: "bosco_result",
        id: boscoResultId,
      });

      const tests = [
        { type: "cmj", data: result.cmj },
        { type: "squatJump", data: result.squatJump },
        { type: "abalakov", data: result.abalakov },
      ];

      for (const test of tests) {
        const baseResultRecord = await createBaseResult(
          dbToUse,
          athleteId,
          test.data.takeoffFoot,
          test.data.sensitivity
        );
        const baseResultId = baseResultRecord.id;
        pendingRecords.push(baseResultRecord);

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

        pendingRecords.push({
          tableName: "basic_result",
          id: basicResultId,
        });

        const jumpTimeRecords = await createJumpTimes(
          dbToUse,
          baseResultId,
          test.data.times
        );
        pendingRecords.push(...jumpTimeRecords);
      }

      if (isManagingTransaction) {
        await dbToUse.execute("COMMIT");
        pushRecord(pendingRecords);
        return boscoResultId;
      }
      return pendingRecords;
    } catch (innerError) {
      if (isManagingTransaction) {
        await dbToUse.execute("ROLLBACK");
      }
      throw innerError;
    }
  } catch (error) {
    console.error("Error adding Bosco result:", error);
    return [];
  }
};

export const addMultipleJumpsResult = async (
  study: CompletedStudy,
  athleteId: string,
  pushRecord: (records: PendingRecord[]) => Promise<void>,
  externalDb?: any
) => {
  const pendingRecords: PendingRecord[] = [];
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    const result = study.results as MultipleJumpsResult;

    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

    try {
      const baseResultRecord = await createBaseResult(
        dbToUse,
        athleteId,
        result.takeoffFoot,
        result.sensitivity
      );
      const baseResultId = baseResultRecord.id;
      pendingRecords.push(baseResultRecord);

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

      pendingRecords.push({
        tableName: "multiple_jumps_result",
        id: multipleJumpsResultId,
      });

      const jumpTimeRecords = await createJumpTimes(
        dbToUse,
        baseResultId,
        result.times
      );
      pendingRecords.push(...jumpTimeRecords);

      if (isManagingTransaction) {
        await dbToUse.execute("COMMIT");
        pushRecord(pendingRecords);
        return multipleJumpsResultId;
      }
      return pendingRecords;
    } catch (innerError) {
      if (isManagingTransaction) {
        await dbToUse.execute("ROLLBACK");
      }
      throw innerError;
    }
  } catch (error) {
    console.error("Error adding Multiple Jumps result:", error);
    return [];
  }
};

export const addMultipleDropJumpResult = async (
  study: CompletedStudy,
  athleteId: string,
  pushRecord: (records: PendingRecord[]) => Promise<void>,
  externalDb?: any
) => {
  const pendingRecords: PendingRecord[] = [];
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  const isManagingTransaction = !externalDb;

  try {
    const result = study.results as MultipleDropJumpResult;

    const currentTimestamp = new Date().toISOString();

    if (isManagingTransaction) {
      await dbToUse.execute("BEGIN TRANSACTION");
    }

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
    pendingRecords.push({
      tableName: "multiple_drop_jump_result",
      id: multipleDropJumpId,
    });

    for (const dropJump of result.dropJumps) {
      const baseResultRecord = await createBaseResult(
        dbToUse,
        athleteId,
        dropJump.takeoffFoot,
        dropJump.sensitivity
      );

      const baseResultId = baseResultRecord.id;
      pendingRecords.push(baseResultRecord);

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

      pendingRecords.push({
        tableName: "drop_jump_result",
        id: dropJumpResultId,
      });

      const jumpTimeRecords = await createJumpTimes(
        dbToUse,
        baseResultId,
        dropJump.times
      );
      pendingRecords.push(...jumpTimeRecords);
    }

    if (isManagingTransaction) {
      await dbToUse.execute("COMMIT");
      pushRecord(pendingRecords);
      return multipleDropJumpId;
    }
    return pendingRecords;
  } catch (error) {
    console.error("Error adding Multiple Drop Jump result:", error);
    return [];
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

export const addMultipleResults = async (
  data: {
    studies: CompletedStudy[];
    ids: string[];
  },
  pushRecord: (records: PendingRecord[]) => Promise<void>
) => {
  if (data.studies.length !== data.ids.length) {
    return [];
  }

  const db = await (Database as any).load("sqlite:ergolab.db");
  try {
    await db.execute("BEGIN TRANSACTION");

    const operationResults: PendingRecord[] = [];
    for (let i = 0; i < data.studies.length; i++) {
      const study = data.studies[i];
      const athleteId = data.ids[i];
      const result = await addResult(study, athleteId, db);
      if (!Array.isArray(result)) {
        continue;
      }
      operationResults.push(...result);
    }
    await db.execute("COMMIT");
    pushRecord(operationResults);
    return operationResults;
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
    return [];
  }
};
