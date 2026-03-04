import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Activity, Cpu, MemoryStick, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface RunningProcessInfo {
  pid: string;
  name: string;
  cpu_usage: number;
  memory_bytes: number;
  status: string;
}

const MAX_CPU_FOR_BAR = 100;
const MAX_MEM_MB_FOR_BAR = 4096;

export default function Execution() {
  const [processes, setProcesses] = useState<RunningProcessInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadProcesses = async () => {
      try {
        const result: RunningProcessInfo[] = await invoke("get_running_processes");
        if (mounted) {
          setProcesses(result);
        }
      } catch (error) {
        console.error("Error fetching running processes:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProcesses();
    const timer = setInterval(loadProcesses, 3000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const filtered = useMemo(
    () =>
      processes.filter(
        (process) =>
          process.name.toLowerCase().includes(search.toLowerCase()) || process.pid.includes(search)
      ),
    [processes, search]
  );

  const topCpu = filtered.slice(0, 5);

  const totalMemoryMb = filtered.reduce((acc, item) => acc + item.memory_bytes, 0) / (1024 * 1024);

  const formatMemory = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ejecución</h1>
          <p className="text-muted-foreground">Monitor de sistema para procesos activos (actualización cada 3s).</p>
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar proceso por nombre o PID..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Procesos activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filtered.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Pico CPU (lista)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topCpu[0] ? `${topCpu[0].cpu_usage.toFixed(1)}%` : "0.0%"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MemoryStick className="h-4 w-4" />
              RAM en uso (lista)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMemoryMb >= 1024 ? `${(totalMemoryMb / 1024).toFixed(2)} GB` : `${totalMemoryMb.toFixed(1)} MB`}</div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Procesos en ejecución</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-330px)] pr-4">
              <div className="space-y-3">
                {filtered.map((process) => {
                  const memoryMb = process.memory_bytes / (1024 * 1024);
                  return (
                    <div key={`${process.pid}-${process.name}`} className="rounded-lg border p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{process.name}</p>
                          <p className="text-xs text-muted-foreground">PID: {process.pid}</p>
                        </div>
                        <Badge variant="secondary">{process.status}</Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>CPU</span>
                          <span>{process.cpu_usage.toFixed(1)}%</span>
                        </div>
                        <Progress value={Math.max(0, Math.min(MAX_CPU_FOR_BAR, process.cpu_usage))} />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Memoria</span>
                          <span>{formatMemory(process.memory_bytes)}</span>
                        </div>
                        <Progress value={Math.max(0, Math.min(100, (memoryMb / MAX_MEM_MB_FOR_BAR) * 100))} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
