use tauri_plugin_sql::Migration;
use tauri_plugin_sql::MigrationKind;

pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);",
            kind: MigrationKind::Up,
        },
       
    ]
} 