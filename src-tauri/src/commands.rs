use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use serialport::SerialPort;
use std::collections::HashMap;
use std::fs;
use std::io::{self, BufRead};
use std::sync::{mpsc, Arc, Mutex}; // Add Arc and Mutex for thread-safe sharing
use std::thread;
use tauri::AppHandle;
use tauri::Emitter;
use tauri::Manager;

lazy_static! {
    static ref ACTIVE_PORTS: Arc<Mutex<HashMap<String, Box<dyn SerialPort + Send>>>> =
        Arc::new(Mutex::new(HashMap::new()));
}
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
#[derive(Debug, Serialize)]
pub struct SerialPortInfo {
    port_name: String,
    port_type: String,
    manufacturer: Option<String>,
    product: Option<String>,
    serial_number: Option<String>,
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

    fs::create_dir_all(&final_path).map_err(|e| format!("Failed to create directory: {}", e))?;

    let file_path = final_path.join(filename);
    let json_string = serde_json::to_string_pretty(&content)
        .map_err(|e| format!("Failed to serialize JSON: {}", e))?;

    fs::write(&file_path, json_string).map_err(|e| format!("Failed to write file: {}", e))?;

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

    let content =
        fs::read_to_string(&file_path).map_err(|e| format!("Failed to read file: {}", e))?;

    let json_data: serde_json::Value =
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse JSON: {}", e))?;

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

    let entries =
        fs::read_dir(&dir_path).map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();

        if path.is_file() && path.extension().and_then(|ext| ext.to_str()) == Some("json") {
            let content = fs::read_to_string(&path)
                .map_err(|e| format!("Failed to read file {:?}: {}", path, e))?;

            let json_data: serde_json::Value = serde_json::from_str(&content)
                .map_err(|e| format!("Failed to parse JSON in {:?}: {}", path, e))?;

            json_files.push(FileData {
                name: path
                    .file_name()
                    .and_then(|name| name.to_str())
                    .unwrap_or("unknown")
                    .to_string(),
                content: json_data,
            });
        }
    }

    Ok(DirectoryJsonResponse {
        message: format!(
            "Successfully read {} JSON files from {:?}",
            json_files.len(),
            dir_path
        ),
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

    fs::remove_file(&file_path).map_err(|e| format!("Failed to delete file: {}", e))?;

    Ok(JsonResponse {
        message: format!("File deleted successfully: {:?}", file_path),
        data: None,
    })
}

#[tauri::command]
pub async fn list_serial_ports() -> Result<Vec<SerialPortInfo>, String> {
    let ports =
        serialport::available_ports().map_err(|e| format!("Error listing serial ports: {}", e))?;

    println!("Found {} ports", ports.len()); // Debug print

    let port_info: Vec<SerialPortInfo> = ports
        .into_iter()
        .map(|p| {
            let port_type = match &p.port_type {
                serialport::SerialPortType::UsbPort(info) => {
                    println!("USB Port found: {}", p.port_name); // Debug print
                    println!("  Manufacturer: {:?}", info.manufacturer);
                    println!("  Product: {:?}", info.product);
                    println!("  Serial Number: {:?}", info.serial_number);

                    SerialPortInfo {
                        port_name: p.port_name,
                        port_type: "USB".to_string(),
                        manufacturer: info.manufacturer.clone(),
                        product: info.product.clone(),
                        serial_number: info.serial_number.clone(),
                    }
                }
                _ => {
                    println!("Non-USB Port found: {}", p.port_name); // Debug print
                    SerialPortInfo {
                        port_name: p.port_name,
                        port_type: "Unknown".to_string(),
                        manufacturer: None,
                        product: None,
                        serial_number: None,
                    }
                }
            };
            port_type
        })
        .collect();

    Ok(port_info)
}

#[tauri::command]
pub async fn cleanup_serial_ports() -> Result<String, String> {
    let mut ports = ACTIVE_PORTS
        .lock()
        .map_err(|e| format!("Failed to lock ports: {}", e))?;

    // Close all active ports with explicit type annotation
    for (port_name, port) in ports.drain() {
        println!("Closing port: {}", port_name);
        // Explicitly drop the port to ensure it's closed
        drop(port);
    }

    Ok("All ports closed successfully".to_string())
}

#[tauri::command]
pub async fn listen_serial(app_handle: tauri::AppHandle, baud_rate: u32) -> Result<String, String> {
    // First cleanup existing ports
    cleanup_serial_ports().await?;

    // List available ports
    let ports =
        serialport::available_ports().map_err(|e| format!("Error listing serial ports: {}", e))?;

    let port_name = match ports.into_iter().find(|p| {
        if let serialport::SerialPortType::UsbPort(info) = &p.port_type {
            let known_manufacturers =
                ["arduino", "ftdi", "silicon labs", "ch340", "wch.cn", "1a86"];
            info.manufacturer.as_ref().map_or(false, |m| {
                known_manufacturers
                    .iter()
                    .any(|&km| m.to_lowercase().contains(km))
            })
        } else {
            false
        }
    }) {
        Some(p) => p.port_name,
        None => return Err("No compatible device found".to_string()),
    };

    let thread_port_name = port_name.clone();

    // Create the port with specific settings
    let port_builder = serialport::new(&thread_port_name, baud_rate)
        .timeout(std::time::Duration::from_millis(100))
        .data_bits(serialport::DataBits::Eight)
        .flow_control(serialport::FlowControl::None)
        .parity(serialport::Parity::None)
        .stop_bits(serialport::StopBits::One);

    println!("Attempting to open port: {}", thread_port_name);

    let port = match port_builder.open() {
        Ok(port) => port,
        Err(e) => {
            let error_msg = format!("Failed to open {}: {}", thread_port_name, e);
            println!("{}", error_msg);
            return Err(error_msg);
        }
    };

    // Store the new port in our active ports map
    {
        let mut ports = ACTIVE_PORTS
            .lock()
            .map_err(|e| format!("Failed to lock ports: {}", e))?;
        ports.insert(thread_port_name.clone(), port);
    }

    let window = app_handle
        .get_webview_window("main")
        .ok_or("Main window not found")?;
    let window = Arc::new(Mutex::new(window));

    let (tx, rx) = std::sync::mpsc::channel();

    // Spawn the reader thread
    thread::spawn({
        let window = Arc::clone(&window);
        let thread_port_name = thread_port_name.clone();
        let ports = ACTIVE_PORTS.clone();

        move || {
            let mut buffer = [0u8; 1024];
            let mut line_buffer = String::new();

            loop {
                // Get a lock on the ports
                let mut ports = match ports.lock() {
                    Ok(guard) => guard,
                    Err(_) => break,
                };

                // Get a mutable reference to our port
                if let Some(port) = ports.get_mut(&thread_port_name) {
                    match port.read(&mut buffer) {
                        Ok(0) => break, // EOF
                        Ok(n) => {
                            // Convert bytes to string and process
                            if let Ok(data) = String::from_utf8(buffer[..n].to_vec()) {
                                line_buffer.push_str(&data);

                                // Process complete lines
                                while let Some(pos) = line_buffer.find('\n') {
                                    let line = line_buffer[..pos].trim().to_string();
                                    if !line.is_empty() {
                                        if let Ok(window) = window.lock() {
                                            if let Err(e) = window.emit("serial-data", &line) {
                                                println!("Error emitting data: {}", e);
                                                return;
                                            }
                                        }
                                    }
                                    line_buffer = line_buffer[pos + 1..].to_string();
                                }
                            }
                        }
                        Err(e) => {
                            match e.kind() {
                                io::ErrorKind::TimedOut => {
                                    // Timeout is normal, continue reading
                                    continue;
                                }
                                _ => {
                                    let _ = tx.send(format!("Error reading from port: {}", e));
                                    break;
                                }
                            }
                        }
                    }
                } else {
                    break;
                }

                // Release the lock
                drop(ports);

                // Small sleep to prevent tight loop
                thread::sleep(std::time::Duration::from_millis(10));
            }
            println!("Reader thread finished for port: {}", thread_port_name);
        }
    });

    // Spawn the error handler thread
    thread::spawn({
        let window = Arc::clone(&window);
        move || {
            for err in rx {
                if let Ok(window) = window.lock() {
                    let _ = window.emit("serial-error", err);
                }
            }
        }
    });

    Ok(port_name)
}
