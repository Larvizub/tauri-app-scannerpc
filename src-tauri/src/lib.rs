use serde::{Serialize, Deserialize};
use sysinfo::{System, Disks, Networks};
use std::sync::Mutex;
use tauri::{Emitter, Manager};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use std::thread;
use std::time::Duration;

#[derive(Serialize, Deserialize, Clone, Debug)]
struct SystemStats {
    cpu_usage: f32,
    memory_usage_pct: f64,
    total_memory: u64,
    used_memory: u64,
    disks: Vec<DiskInfo>,
    network_rx: u64,
    network_tx: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct DiskInfo {
    name: String,
    total: u64,
    available: u64,
}

struct AppState {
    sys: Mutex<System>,
}

fn get_stats(sys: &mut System) -> SystemStats {
    sys.refresh_cpu_all();
    sys.refresh_memory();

    let cpu_usage = sys.global_cpu_usage();
    let total_memory = sys.total_memory();
    let used_memory = sys.used_memory();
    let memory_usage_pct = (used_memory as f64 / total_memory as f64) * 100.0;

    let disks_info = Disks::new_with_refreshed_list();
    let disks = disks_info.iter().map(|d| DiskInfo {
        name: d.mount_point().to_string_lossy().to_string(),
        total: d.total_space(),
        available: d.available_space(),
    }).collect();

    let networks = Networks::new_with_refreshed_list();
    let mut network_rx = 0;
    let mut network_tx = 0;
    for (_, data) in &networks {
        network_rx += data.received();
        network_tx += data.transmitted();
    }

    SystemStats {
        cpu_usage,
        memory_usage_pct,
        total_memory,
        used_memory,
        disks,
        network_rx,
        network_tx,
    }
}

#[tauri::command]
fn get_system_stats(state: tauri::State<'_, AppState>) -> SystemStats {
    let mut sys = state.sys.lock().unwrap();
    get_stats(&mut sys)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            sys: Mutex::new(System::new_all()),
        })
        .setup(|app| {
            let handle = app.handle().clone();
            thread::spawn(move || {
                let mut sys = System::new_all();
                loop {
                    let stats = get_stats(&mut sys);
                    let _ = handle.emit("system-stats", stats);
                    thread::sleep(Duration::from_secs(2));
                }
            });

            // Configurar el menú de la bandeja (System Tray)
            let quit_i = MenuItem::with_id(app, "quit", "Salir", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Mostrar Dashboard", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            // Crear el icono de la bandeja
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| {
                    if event.id.as_ref() == "quit" {
                        app.exit(0);
                    } else if event.id.as_ref() == "show" {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        // Evitar que la aplicación se cierre al cerrar la ventana principal
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                window.hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_system_stats])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
