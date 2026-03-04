import { useEffect, useState, useRef } from "react";
import { useTelemetry } from "@/lib/telemetry";
import { 
  saveMetrics, 
  loginAnonymously, 
  saveInstalledApps, 
  saveRunningProcesses,
  saveCriticalEvent,
  registerDevice 
} from "@/lib/firebase";
import { invoke } from "@tauri-apps/api/core";
import { checkSystemHealth } from "@/lib/healthRules";

export function useFirebaseSync() {
  const stats = useTelemetry();
  const [hostname, setHostname] = useState<string | null>(null);
  const lastEventSaved = useRef<Record<string, number>>({});
  const statsRef = useRef(stats);

  // Actualizar la referencia de los stats para el intervalo
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  useEffect(() => {
    const initSync = async () => {
      try {
        // 1. Autenticar primero (CRÍTICO para permisos de escritura)
        await loginAnonymously();
        console.log("Autenticación anónima exitosa");

        // 2. Obtener el nombre del equipo
        const name = await invoke<string>("get_hostname");
        setHostname(name);
        
        // 3. Registrar el dispositivo como "usuario" en la BD
        await registerDevice(name);
        
        // 4. Sincronizar aplicaciones instaladas una vez al iniciar
        const apps = await invoke<unknown[]>("get_installed_apps");
        await saveInstalledApps(name, apps as { name: string; version?: string; path?: string }[]);
        
        console.log(`Sincronización inicial completada para: ${name}`);
      } catch (error) {
        console.error("Error en la sincronización inicial:", error);
      }
    };

    initSync();
  }, []);

  // Monitor de eventos críticos (se dispara con cada actualización de stats)
  useEffect(() => {
    if (!stats || !hostname) return;

    const { criticalEvents } = checkSystemHealth(stats);
    const now = Date.now();

    criticalEvents.forEach(event => {
      // Evitar guardar el mismo tipo de evento más de una vez cada 5 minutos para no saturar
      const lastSavedTime = lastEventSaved.current[event.type] || 0;
      if (now - lastSavedTime > 300000) { // 5 minutos
        saveCriticalEvent(hostname, event)
          .then(() => console.log(`Evento crítico guardado: ${event.type}`))
          .catch((err: unknown) => console.error("Error al guardar evento crítico:", err));
        lastEventSaved.current[event.type] = now;
      }
    });
  }, [stats, hostname]);

  // Sincronización de métricas generales cada 60 segundos
  useEffect(() => {
    if (!hostname) return;

    const interval = setInterval(() => {
      if (statsRef.current) {
        saveMetrics(hostname, statsRef.current)
          .then(() => console.log("Métricas sincronizadas con Firebase"))
          .catch((err: unknown) => console.error("Error al sincronizar métricas:", err));
      }

      invoke<Array<{ pid: string; name: string; cpu_usage?: number; memory_bytes?: number; status?: string }>>("get_running_processes")
        .then((processes) => saveRunningProcesses(hostname, processes.slice(0, 150)))
        .then(() => console.log("Procesos en ejecución sincronizados con Firebase"))
        .catch((err: unknown) => console.error("Error al sincronizar procesos en ejecución:", err));
    }, 60000);

    return () => clearInterval(interval);
  }, [hostname]);
}
