use rand::RngCore;
use sha2::{Digest, Sha256};
use tauri_plugin_sql::{Migration, MigrationKind};

#[tauri::command]
fn compress_data(data: String) -> Result<Vec<u8>, String> {
    zstd::encode_all(data.as_bytes(), 0).map_err(|e| e.to_string())
}

#[tauri::command]
fn decompress_data(data: Vec<u8>) -> Result<String, String> {
    let decompressed = zstd::decode_all(data.as_slice()).map_err(|e| e.to_string())?;
    String::from_utf8(decompressed).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_or_create_stronghold_password(app: tauri::AppHandle) -> Result<String, String> {
    use std::fs;
    use tauri::Manager;

    let local_data_dir = app.path().app_local_data_dir().map_err(|e| e.to_string())?;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        // Define your migrations here
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: include_str!("../migrations/0001_boring_barracuda.sql"),
            kind: MigrationKind::Up,
        },
    ];
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:test.db", migrations)
                .build(),
        )
        .plugin(
            tauri_plugin_stronghold::Builder::new(|password| {
                let mut hasher = Sha256::new();
                hasher.update(password);
                hasher.finalize().to_vec()
            })
            .build(),
        )
        .invoke_handler(tauri::generate_handler![
            get_or_create_stronghold_password,
            compress_data,
            decompress_data
        ])
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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
