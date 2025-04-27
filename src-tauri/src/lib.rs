mod commands;
mod migrations;
use tauri_plugin_sql::Builder;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(
            Builder::default()
                .add_migrations("sqlite:app.db", migrations::get_migrations())
                .build()
        )
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::save_json,
            commands::read_json,
            commands::read_directory_jsons,
            commands::delete_json,
            commands::listen_serial,
            commands::list_serial_ports
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
