export const tablesInfo = new Map([
  ["coach", "id"], // Coach must come before athlete due to foreign key
  ["athlete", "id"],
  // Test-related tables that depend on athlete
  ["base_result", "id"], // Base result depends on athlete and must come before all tables that reference it
  ["bosco_result", "id"], // Bosco result depends on athlete
  ["event", "id"], // Event depends on coach and athlete
  ["multiple_drop_jump_result", "id"], // Multiple drop jump result depends on athlete
  ["athlete_weekly_stats", "athlete_id,week_start_date"], // Athlete weekly stats depends on athlete - composite primary key
  ["athlete_session_performance", "session_id,week_start_date"], // Athlete session performance depends on session and must come after athlete_weekly_stats
  // All tables below reference base_result and must come after it
  ["basic_result", "id"], // References base_result and bosco_result
  ["drop_jump_result", "id"], // References base_result and multiple_drop_jump_result
  ["multiple_jumps_result", "id"], // References base_result
  ["jump_time", "id"], // References base_result
  // Training-related tables
  ["exercises", "id"], // Exercises must come before selected_exercises
  ["training_plans", "id"], // Training plans must come before sessions and models
  ["training_models", "id"], // Models reference training_plans
  ["sessions", "id"], // Sessions reference training_plans
  ["session_days", "id"], // Session days reference sessions
  ["training_blocks", "id"], // Training blocks reference sessions
  ["selected_exercises", "id"], // Selected exercises reference sessions, exercises, and training_blocks
  ["progressions", "id"], // Progressions reference selected_exercises or training_blocks
  ["volume_reductions", "id"], // Volume reductions reference selected_exercises or training_blocks
  ["effort_reductions", "id"], // Effort reductions reference selected_exercises or training_blocks
]);

export type TableName =
  | "coach"
  | "athlete"
  | "base_result"
  | "bosco_result"
  | "event"
  | "multiple_drop_jump_result"
  | "athlete_weekly_stats"
  | "athlete_session_performance"
  | "basic_result"
  | "drop_jump_result"
  | "multiple_jumps_result"
  | "jump_time"
  | "exercises"
  | "training_plans"
  | "training_models"
  | "sessions"
  | "session_days"
  | "training_blocks"
  | "selected_exercises"
  | "progressions"
  | "volume_reductions"
  | "effort_reductions";
