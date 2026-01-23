use serde::{Serialize, Deserialize};
use sysinfo::{System, Disks, Networks};
use std::sync::Mutex;
use tauri::{Emitter, Manager};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use std::thread;
use std::time::Duration;
use std::process::Command;
use tauri_plugin_autostart::MacosLauncher;

#[derive(Serialize, Deserialize, Clone, Debug)]
struct SystemStats {
    cpu_usage: f32,
    memory_usage_pct: f64,
    total_memory: u64,
    used_memory: u64,
    disks: Vec<DiskInfo>,
    network_rx: u64,
    network_tx: u64,
    network_rx_bps: f64,
    network_tx_bps: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct DiskInfo {
    name: String,
    total: u64,
    available: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct AppInfo {
    name: String,
    version: String,
}

struct AppState {
    sys: Mutex<System>,
}

fn get_macos_network_stats() -> (u64, u64) {
    let output = Command::new("netstat")
        .args(&["-i", "-b", "-n"])
        .output();

    if let Ok(out) = output {
        let stdout = String::from_utf8_lossy(&out.stdout);
        let mut total_rx = 0;
        let mut total_tx = 0;

        for line in stdout.lines().skip(1) {
            let parts: Vec<&str> = line.split_whitespace().collect();
            // macOS netstat -ib -n layout usually has 11 columns if Address is present
            // Name Mtu Network Address Ipkts Ierrs Ibytes Opkts Oerrs Obytes Coll
            // 0    1   2       3       4     5     6      7     8     9      10
            if parts.len() >= 10 {
                // If the 3rd column starts with <Link#, it's the physical interface stats
                if parts[2].starts_with("<Link#") {
                    if let Ok(rx) = parts[6].parse::<u64>() {
                        total_rx += rx;
                    }
                    if let Ok(tx) = parts[9].parse::<u64>() {
                        total_tx += tx;
                    }
                }
            }
        }
        return (total_rx, total_tx);
    }
    (0, 0)
}

fn get_windows_network_stats() -> (u64, u64) {
    let output = Command::new("powershell")
        .args(&["-Command", "Get-NetAdapterStatistics | Select-Object ReceivedBytes, SentBytes | ConvertTo-Json"])
        .output();

    if let Ok(out) = output {
        let stdout = String::from_utf8_lossy(&out.stdout);
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&stdout) {
            let mut total_rx = 0;
            let mut total_tx = 0;
            if let Some(arr) = json.as_array() {
                for item in arr {
                    total_rx += item["ReceivedBytes"].as_u64().unwrap_or(0);
                    total_tx += item["SentBytes"].as_u64().unwrap_or(0);
                }
            } else {
                total_rx += json["ReceivedBytes"].as_u64().unwrap_or(0);
                total_tx += json["SentBytes"].as_u64().unwrap_or(0);
            }
            return (total_rx, total_tx);
        }
    }
    (0, 0)
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

    // Fallback para macOS si sysinfo no reporta datos
    if network_rx == 0 && cfg!(target_os = "macos") {
        let (mac_rx, mac_tx) = get_macos_network_stats();
        if mac_rx > 0 {
            network_rx = mac_rx;
            network_tx = mac_tx;
        }
    }

    // Fallback para Windows si sysinfo no reporta datos
    if network_rx == 0 && cfg!(target_os = "windows") {
        let (win_rx, win_tx) = get_windows_network_stats();
        if win_rx > 0 {
            network_rx = win_rx;
            network_tx = win_tx;
        }
    }

    SystemStats {
        cpu_usage,
        memory_usage_pct,
        total_memory,
        used_memory,
        disks,
        network_rx,
        network_tx,
        network_rx_bps: 0.0,
        network_tx_bps: 0.0,
    }
}

#[tauri::command]
fn get_system_stats(state: tauri::State<'_, AppState>) -> SystemStats {
    let mut sys = state.sys.lock().unwrap();
    get_stats(&mut sys)
}

#[tauri::command]
fn get_hostname() -> String {
    System::host_name().unwrap_or_else(|| "Unknown-PC".to_string())
}

#[tauri::command]
fn get_installed_apps() -> Vec<AppInfo> {
    let mut apps = Vec::new();

    #[cfg(target_os = "macos")]
    {
        let paths = ["/Applications", "/System/Applications"];
        for path in paths {
            if let Ok(entries) = std::fs::read_dir(path) {
                for entry in entries.flatten() {
                    let name = entry.file_name().to_string_lossy().into_owned();
                    if name.ends_with(".app") {
                        apps.push(AppInfo {
                            name: name.replace(".app", ""),
                            version: "N/A".to_string(), // Para versión real en macOS se requiere leer Info.plist
                        });
                    }
                }
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        let output = Command::new("powershell")
            .args(&["-Command", "Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*, HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*, HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Where-Object { $_.DisplayName -ne $null } | Select-Object DisplayName, DisplayVersion | ConvertTo-Json"])
            .output();

        if let Ok(out) = output {
            let stdout = String::from_utf8_lossy(&out.stdout);
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&stdout) {
                if let Some(arr) = json.as_array() {
                    for item in arr {
                        if let Some(name) = item["DisplayName"].as_str() {
                            apps.push(AppInfo {
                                name: name.to_string(),
                                version: item["DisplayVersion"].as_str().unwrap_or("N/A").to_string(),
                            });
                        }
                    }
                } else if let Some(name) = json["DisplayName"].as_str() {
                    apps.push(AppInfo {
                        name: name.to_string(),
                        version: json["DisplayVersion"].as_str().unwrap_or("N/A").to_string(),
                    });
                }
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(entries) = std::fs::read_dir("/usr/share/applications") {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().into_owned();
                if name.ends_with(".desktop") {
                    apps.push(AppInfo {
                        name: name.replace(".desktop", ""),
                        version: "N/A".to_string(),
                    });
                }
            }
        }
    }

    apps.sort_by(|a: &AppInfo, b: &AppInfo| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    apps
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            sys: Mutex::new(System::new_all()),
        })
        .invoke_handler(tauri::generate_handler![get_system_stats, get_hostname, get_installed_apps])
        .setup(|app| {
            let handle = app.handle().clone();
            thread::spawn(move || {
                let mut sys = System::new_all();
                let mut prev_stats: Option<SystemStats> = None;
                let mut prev_instant = std::time::Instant::now();
                loop {
                    let stats = get_stats(&mut sys);
                    let now = std::time::Instant::now();
                    let elapsed = now.duration_since(prev_instant).as_secs_f64();

                    let mut stats_out = stats.clone();
                    if let Some(prev) = &prev_stats {
                        let rx_delta = stats.network_rx.saturating_sub(prev.network_rx) as f64;
                        let tx_delta = stats.network_tx.saturating_sub(prev.network_tx) as f64;
                        if elapsed > 0.0 {
                            stats_out.network_rx_bps = rx_delta / elapsed;
                            stats_out.network_tx_bps = tx_delta / elapsed;
                        }
                    }

                    prev_stats = Some(stats_out.clone());
                    prev_instant = now;

                    let _ = handle.emit("system-stats", stats_out);
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
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--minimized"])))
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
