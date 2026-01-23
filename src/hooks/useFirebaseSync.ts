import { useEffect, useState } from "react";
import { useTelemetry } from "@/lib/telemetry";
import { saveMetrics, loginAnonymously } from "@/lib/firebase";
import { invoke } from "@tauri-apps/api/core";

export function useFirebaseSync() {
  const stats = useTelemetry();
  const [hostname, setHostname] = useState<string>("unknown-pc");

  useEffect(() => {
    // Autenticar automáticamente al iniciar la app
    loginAnonymously().catch(console.error);

    // Obtener el nombre del equipo desde Rust
    invoke<string>("get_hostname").then(setHostname).catch(console.error);
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
