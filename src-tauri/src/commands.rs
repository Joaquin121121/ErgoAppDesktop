use serde::{Deserialize, Serialize};
use std::fs;
use tauri::AppHandle;
use tauri::Manager;
use std::io::{self, BufRead};
use std::sync::{mpsc, Arc, Mutex}; // Add Arc and Mutex for thread-safe sharing
use std::thread;
use serialport::SerialPort;
use tauri::Emitter;

#[derive(Debug, Serialize, Deserialize)]
pub struct JsonResponse {
    message: String,
    data: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DirectoryJsonResponse {
    message: String,
    files: Vec<FileData>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileData {
    name: String,
    content: serde_json::Value,
}

// Note the #[tauri::command] attribute on each function
#[tauri::command(async)]
pub async fn save_json(
    app_handle: AppHandle,
    directory: Option<String>,
    filename: String,
    content: serde_json::Value,
) -> Result<JsonResponse, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    let mut final_path = app_dir;
    if let Some(dir) = directory {
        final_path = final_path.join(dir);
    }
    
    fs::create_dir_all(&final_path)
        .map_err(|e| format!("Failed to create directory: {}", e))?;
    
    let file_path = final_path.join(filename);
    let json_string = serde_json::to_string_pretty(&content)
        .map_err(|e| format!("Failed to serialize JSON: {}", e))?;
    
    fs::write(&file_path, json_string)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    
    Ok(JsonResponse {
        message: format!("File saved successfully at {:?}", file_path),
        data: None,
    })
}

#[tauri::command(async)]
pub async fn read_json(
    app_handle: AppHandle,
    directory: Option<String>,
    filename: String,
) -> Result<JsonResponse, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    let mut final_path = app_dir;
    if let Some(dir) = directory {
        final_path = final_path.join(dir);
    }
    
    let file_path = final_path.join(filename);
    
    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    let json_data: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;
    
    Ok(JsonResponse {
        message: format!("File read successfully from {:?}", file_path),
        data: Some(json_data),
    })
}

#[tauri::command(async)]
pub async fn read_directory_jsons(
    app_handle: AppHandle,
    directory: String,
) -> Result<DirectoryJsonResponse, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    let dir_path = app_dir.join(&directory);
    
    if !dir_path.exists() {
        return Ok(DirectoryJsonResponse {
            message: format!("Directory {:?} is empty or doesn't exist", dir_path),
            files: Vec::new(),
        });
    }

    let mut json_files = Vec::new();

    let entries = fs::read_dir(&dir_path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();

        if path.is_file() && path.extension().and_then(|ext| ext.to_str()) == Some("json") {
            let content = fs::read_to_string(&path)
                .map_err(|e| format!("Failed to read file {:?}: {}", path, e))?;
            
            let json_data: serde_json::Value = serde_json::from_str(&content)
                .map_err(|e| format!("Failed to parse JSON in {:?}: {}", path, e))?;

            json_files.push(FileData {
                name: path.file_name()
                    .and_then(|name| name.to_str())
                    .unwrap_or("unknown")
                    .to_string(),
                content: json_data,
            });
        }
    }

    Ok(DirectoryJsonResponse {
        message: format!("Successfully read {} JSON files from {:?}", json_files.len(), dir_path),
        files: json_files,
    })
}


#[tauri::command(async)]
pub async fn delete_json(
    app_handle: AppHandle,
    directory: Option<String>,
    filename: String,
) -> Result<JsonResponse, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    let mut final_path = app_dir;
    if let Some(dir) = directory {
        final_path = final_path.join(dir);
    }
    
    let file_path = final_path.join(filename);
    
    if !file_path.exists() {
        return Err(format!("File does not exist: {:?}", file_path));
    }
    
    fs::remove_file(&file_path)
        .map_err(|e| format!("Failed to delete file: {}", e))?;
    
    Ok(JsonResponse {
        message: format!("File deleted successfully: {:?}", file_path),
        data: None,
    })
}

#[tauri::command]
pub fn listen_serial(app_handle: tauri::AppHandle, port_name: String, baud_rate: u32) -> Result<(), String> {
    // Ensure Manager is in scope for `get_webview_window`
    let window = app_handle.get_webview_window("main").ok_or("Main window not found")?;

    // Wrap window in Arc<Mutex<>> to share across threads safely
    let window = Arc::new(Mutex::new(window));
    
    let (tx, rx) = std::sync::mpsc::channel();

    // Spawn a thread for serial communication
    thread::spawn({
        let window = Arc::clone(&window); // Clone the Arc to move it into the thread
        move || {
            let port = serialport::new(&port_name, baud_rate)
                .timeout(std::time::Duration::from_secs(2))
                .open();

            let mut port = match port {
                Ok(p) => p,
                Err(e) => {
                    let _ = tx.send(format!("Error opening serial port: {}", e));
                    return;
                }
            };

            let mut reader = io::BufReader::new(port);

            loop {
                let mut buffer = String::new();
                match reader.read_line(&mut buffer) {
                    Ok(_) => {
                        let trimmed = buffer.trim().to_string();
                        if !trimmed.is_empty() {
                            // Lock the window and emit data
                            if let Ok(window) = window.lock() {
                                let _ = window.emit("serial-data", trimmed);
                            }
                        }
                    }
                    Err(e) => {
                        let _ = tx.send(format!("Error reading from serial port: {}", e));
                        break;
                    }
                }
            }
        }
    });

    // Log errors from the serial thread to the frontend
    thread::spawn({
        let window = Arc::clone(&window); // Clone the Arc to move it into this thread
        move || {
            for err in rx {
                // Lock the window and emit error messages
                if let Ok(window) = window.lock() {
                    let _ = window.emit("serial-error", err);
                }
            }
        }
    });

    Ok(())
}
