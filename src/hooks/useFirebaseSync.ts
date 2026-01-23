import { useEffect } from "react";
import { useTelemetry } from "@/lib/telemetry";
import { saveMetrics, loginAnonymously } from "@/lib/firebase";

export function useFirebaseSync(deviceId: string = "default-pc") {
  const stats = useTelemetry();

  useEffect(() => {
    // Autenticar automáticamente al iniciar la app
    loginAnonymously().catch(console.error);
  }, []);

  useEffect(() => {
    if (!stats) return;

    // Sincronizar cada 60 segundos
    const interval = setInterval(() => {
      saveMetrics(deviceId, stats).catch(console.error);
    }, 60000);

    return () => clearInterval(interval);
  }, [stats, deviceId]);
}
