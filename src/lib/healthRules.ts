import { SystemStats } from "./telemetry";

export interface HealthStatus {
  isHealthy: boolean;
  warnings: string[];
}

export function checkSystemHealth(stats: SystemStats | null): HealthStatus {
  const warnings: string[] = [];

  if (!stats) return { isHealthy: true, warnings: [] };

  if (stats.cpu_usage > 90) {
    warnings.push("Uso de CPU muy alto (>90%).");
  }

  if (stats.memory_usage_pct > 90) {
    warnings.push("Memoria RAM casi llena.");
  }

  // Check disks
  stats.disks.forEach(disk => {
    const usedPct = ((disk.total - disk.available) / disk.total) * 100;
    if (usedPct > 95) {
      warnings.push(`Disco ${disk.name} casi lleno (${usedPct.toFixed(1)}%).`);
    }
  });

  return {
    isHealthy: warnings.length === 0,
    warnings
  };
}
