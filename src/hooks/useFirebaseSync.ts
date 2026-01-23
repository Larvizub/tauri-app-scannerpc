import { useEffect, useState, useRef } from "react";
import { useTelemetry } from "@/lib/telemetry";
import { saveMetrics, loginAnonymously, saveInstalledApps, saveCriticalEvent } from "@/lib/firebase";
import { invoke } from "@tauri-apps/api/core";
import { checkSystemHealth } from "@/lib/healthRules";

export function useFirebaseSync() {
  const stats = useTelemetry();
  const [hostname, setHostname] = useState<string>("unknown-pc");
  const lastEventSaved = useRef<Record<string, number>>({});

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

  // Monitor de eventos críticos
  useEffect(() => {
    if (!stats || !hostname) return;

    const { criticalEvents } = checkSystemHealth(stats);
    const now = Date.now();

    criticalEvents.forEach(event => {
      // Evitar guardar el mismo tipo de evento más de una vez cada 5 minutos
      const lastSavedTime = lastEventSaved.current[event.type] || 0;
      if (now - lastSavedTime > 5 * 60 * 1000) {
        saveCriticalEvent(hostname, event).catch(console.error);
        lastEventSaved.current[event.type] = now;
      }
    });

  }, [stats, hostname]);

  useEffect(() => {
    if (!stats || !hostname) return;

    // Sincronizar cada 60 segundos
    const interval = setInterval(() => {
      saveMetrics(hostname, stats).catch(console.error);
    }, 60000);

    return () => clearInterval(interval);
  }, [stats, hostname]);
}
