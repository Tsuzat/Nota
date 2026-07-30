// Using local key file for Stronghold password
use rand::RngCore;
use sha2::{Digest, Sha256};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_or_create_stronghold_password(app: tauri::AppHandle) -> Result<String, String> {
    use std::fs;
    use tauri::Manager;

    let local_data_dir = app.path().app_local_data_dir()
        .map_err(|e| e.to_string())?;

    fs::create_dir_all(&local_data_dir).map_err(|e| e.to_string())?;

    let key_path = local_data_dir.join("nota.key");
    if key_path.exists() {
        let password = fs::read_to_string(&key_path).map_err(|e| e.to_string())?;
        Ok(password)
    } else {
        let mut key = [0u8; 32];
        rand::rng().fill_bytes(&mut key);
        let password: String = key.iter().map(|b| format!("{:02x}", b)).collect();
        fs::write(&key_path, &password).map_err(|e| e.to_string())?;
        Ok(password)
    }
}

#[tauri::command]
fn compress_data(data: String) -> Result<Vec<u8>, String> {
    zstd::encode_all(data.as_bytes(), 0).map_err(|e| e.to_string())
}

#[tauri::command]
fn decompress_data(data: Vec<u8>) -> Result<String, String> {
    let decompressed = zstd::decode_all(data.as_slice()).map_err(|e| e.to_string())?;
    String::from_utf8(decompressed).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_stronghold::Builder::new(|password| {
                let mut hasher = Sha256::new();
                hasher.update(password);
                hasher.finalize().to_vec()
            })
            .build(),
        )
        .invoke_handler(tauri::generate_handler![
            greet, 
            get_or_create_stronghold_password,
            compress_data,
            decompress_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
