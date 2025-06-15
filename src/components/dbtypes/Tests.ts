export interface DbBaseResult {
  id: string;
  takeoff_foot: string;
  sensitivity: number;
  created_at: string;
  deleted_at: string;
  last_changed: string;
  athlete_id: string;
}

export interface DbJumpTime {
  id: string;
  base_result_id: string;
  index: number;
  time: number;
  deleted?: boolean;
  deleted_at: string | null;
  floor_time: number | null;
  stiffness: number | null;
  performance: number | null;
}
