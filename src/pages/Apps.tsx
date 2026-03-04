import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, Search } from "lucide-react";

interface AppInfo {
  pid: string;
  name: string;
  cpu_usage: number;
  memory_bytes: number;
  status: string;
}

export default function Apps() {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchApps = async () => {
      try {
        const result: AppInfo[] = await invoke("get_running_processes");
        if (isMounted) {
          setApps(result);
        }
      } catch (error) {
        console.error("Error fetching apps:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchApps();

    const interval = setInterval(fetchApps, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const filteredApps = apps.filter((app) =>
    app.name.toLowerCase().includes(search.toLowerCase()) || app.pid.includes(search)
  );

  const formatMemory = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Programas en ejecución</h1>
          <p className="text-muted-foreground">
            Procesos activos detectados en tu sistema (actualización cada 5s).
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre o PID..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Total: {filteredApps.length} procesos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-280px)] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredApps.map((app, index) => (
                  <div
                    key={`${app.pid}-${app.name}-${index}`}
                    className="flex items-center space-x-4 rounded-lg border p-4 hover:bg-accent transition-colors"
                  >
                    <div className="h-10 w-10 flex items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Package className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">
                        {app.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        PID: {app.pid} · CPU: {app.cpu_usage.toFixed(1)}% · RAM: {formatMemory(app.memory_bytes)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        Estado: {app.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
