import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

export interface SystemStats {
  cpu_usage: number;
  memory_usage_pct: number;
  total_memory: number;
  used_memory: number;
  disks: DiskInfo[];
  network_rx: number;
  network_tx: number;
  network_rx_bps: number;
  network_tx_bps: number;
}

export interface DiskInfo {
  name: string;
  total: number;
  available: number;
}

export function useTelemetry() {
  const [stats, setStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    const unlisten = listen<SystemStats>("system-stats", (event) => {
      setStats(event.payload);
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  return stats;
}
