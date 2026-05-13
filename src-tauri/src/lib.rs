#[tauri::command]
fn privacy_mode() -> &'static str {
    "local-first"
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![privacy_mode])
        .run(tauri::generate_context!())
        .expect("error while running FWM's Claude Chat Archive Viewer");
}

