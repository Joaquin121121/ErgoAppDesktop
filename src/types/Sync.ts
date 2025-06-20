import { TableName } from "../constants/dbMetadata";

export interface SyncMetadata {
  lastSync: string | null;
  pendingRecords: PendingRecord[];
}

export interface PendingRecord {
  tableName: TableName;
  id: string;
}
