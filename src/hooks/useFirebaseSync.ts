import { useEffect, useState } from "react";
import { useTelemetry } from "@/lib/telemetry";
import { saveMetrics, loginAnonymously, saveInstalledApps } from "@/lib/firebase";
import { invoke } from "@tauri-apps/api/core";

export function useFirebaseSync() {
  const stats = useTelemetry();
  const [hostname, setHostname] = useState<string>("unknown-pc");

  useEffect(() => {
    // Autenticar automáticamente al iniciar la app
    loginAnonymously().catch(console.error);

    // Obtener el nombre del equipo y sincronizar apps
    invoke<string>("get_hostname").then((name) => {
      setHostname(name);
      
      // Sincronizar aplicaciones instaladas una vez al iniciar
      invoke<any[]>("get_installed_apps")
        .then((apps) => {
          saveInstalledApps(name, apps).catch(console.error);
        })
        .catch(console.error);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!stats || !hostname) return;

    // Sincronizar cada 60 segundos
    const interval = setInterval(() => {
      saveMetrics(hostname, stats).catch(console.error);
    }, 60000);

    return () => clearInterval(interval);
  }, [stats, hostname]);
}
