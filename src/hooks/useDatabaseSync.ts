import Database from "@tauri-apps/plugin-sql";
import { tableNames } from "../constants/dbMetadata";
import { supabase } from "@/supabase";

interface SyncMetadata {
  lastSync: string | null;
  pendingRecords: string[];
}

const SYNC_METADATA_KEY = "syncMetadata";

const getInitialSyncMetadata = (): SyncMetadata => {
  const storedMetadata = localStorage.getItem(SYNC_METADATA_KEY);
  if (storedMetadata) {
    return JSON.parse(storedMetadata);
  }
  return {
    lastSync: null,
    pendingRecords: [],
  };
};

const updateSyncMetadata = (metadata: Partial<SyncMetadata>) => {
  const currentMetadata = getInitialSyncMetadata();
  const updatedMetadata = {
    ...currentMetadata,
    ...metadata,
  };
  localStorage.setItem(SYNC_METADATA_KEY, JSON.stringify(updatedMetadata));
};

const initializeSyncMetadata = () => {
  const existingMetadata = localStorage.getItem(SYNC_METADATA_KEY);
  if (!existingMetadata) {
    const initialMetadata: SyncMetadata = {
      lastSync: null,
      pendingRecords: [],
    };
    localStorage.setItem(SYNC_METADATA_KEY, JSON.stringify(initialMetadata));
  }
};

const syncTable = async (tableName: string, externalDb: any) => {
  const dbToUse =
    externalDb || (await (Database as any).load("sqlite:ergolab.db"));
  let remoteQuery = supabase.from(tableName).select("*");
};
const fullScaleSync = async () => {
  initializeSyncMetadata();
  const db = await (Database as any).load("sqlite:ergolab.db");
  const metadata = getInitialSyncMetadata();
  const lastSync = metadata.lastSync;

  for (const tableName of tableNames) {
    const records = await db.select(
      `SELECT * FROM ${tableName} WHERE last_changed > ?`,
      [lastSync]
    );
    if (records.length > 0) {
    }
  }
};
