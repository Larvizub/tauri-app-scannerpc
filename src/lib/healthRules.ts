import { SystemStats } from "./telemetry";

export interface HealthStatus {
  isHealthy: boolean;
  warnings: string[];
  criticalEvents: CriticalEvent[];
}

export interface CriticalEvent {
  type: 'CPU' | 'RAM' | 'DISK' | 'TEMPERATURE';
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
}

export function checkSystemHealth(stats: SystemStats | null): HealthStatus {
  const warnings: string[] = [];
  const criticalEvents: CriticalEvent[] = [];
  const now = Date.now();

  if (!stats) return { isHealthy: true, warnings: [], criticalEvents: [] };

  if (stats.cpu_usage > 90) {
    const msg = "Uso de CPU crítico (>90%)";
    warnings.push(msg);
    criticalEvents.push({ type: 'CPU', value: stats.cpu_usage, threshold: 90, message: msg, timestamp: now });
  }

  if (stats.memory_usage_pct > 90) {
    const msg = "Memoria RAM crítica (>90%)";
    warnings.push(msg);
    criticalEvents.push({ type: 'RAM', value: stats.memory_usage_pct, threshold: 90, message: msg, timestamp: now });
  }

  // Check disks
  stats.disks.forEach(disk => {
    const usedPct = ((disk.total - disk.available) / disk.total) * 100;
    if (usedPct > 95) {
      const msg = `Disco ${disk.name} casi lleno (${usedPct.toFixed(1)}%)`;
      warnings.push(msg);
      criticalEvents.push({ type: 'DISK', value: usedPct, threshold: 95, message: msg, timestamp: now });
    }
  });

  return {
    isHealthy: (warnings.length === 0),
    warnings,
    criticalEvents
  };
}
