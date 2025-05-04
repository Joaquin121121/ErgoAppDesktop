use tauri_plugin_sql::Migration;
use tauri_plugin_sql::MigrationKind;
use std::fs;
use std::path::Path;
use std::env;


pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_all_tables_v1",
            sql: include_str!("../../supabase/migrations/parsedMigrations.sql"),
            kind: MigrationKind::Up,
        },

    ]
} 