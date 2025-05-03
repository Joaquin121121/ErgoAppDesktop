use tauri_plugin_sql::Migration;
use tauri_plugin_sql::MigrationKind;

pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_all_tables",
            sql: include_str!("../../supabase/migrations/parsedMigrations.sql"),
            kind: MigrationKind::Up,
        },
    ]
} 