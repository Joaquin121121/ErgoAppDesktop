use serde::{Deserialize, Serialize};
use std::fs;
use tauri::AppHandle;
use tauri::Manager;

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