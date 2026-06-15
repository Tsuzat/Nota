use keyring::Entry;
use rand::RngCore;
use sha2::{Digest, Sha256};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_or_create_stronghold_password() -> Result<String, String> {
    let entry = Entry::new("app.nota", "stronghold-key")
        .map_err(|e| e.to_string())?;

    match entry.get_password() {
        Ok(password) => Ok(password),
        Err(keyring::Error::NoEntry) => {
            let mut key = [0u8; 32];
            rand::thread_rng().fill_bytes(&mut key);
            let password: String = key.iter().map(|b| format!("{:02x}", b)).collect();
            entry.set_password(&password)
                .map_err(|e| e.to_string())?;
            Ok(password)
        }
        Err(e) => Err(e.to_string()),
    }
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
        .invoke_handler(tauri::generate_handler![greet, get_or_create_stronghold_password])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
