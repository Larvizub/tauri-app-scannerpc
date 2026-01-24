import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertCircle, Calendar, Filter, History } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CriticalEvent {
  id: string;
  type: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
}

export default function CriticalHistory() {
  const [events, setEvents] = useState<CriticalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [hostname, setHostname] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const name: string = await invoke("get_hostname");
        setHostname(name);
        const snapshot = await get(ref(db, `critical_history/${name}`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          const eventList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setEvents(eventList.sort((a, b) => b.timestamp - a.timestamp));
        }
      } catch (error) {
        console.error("Error fetching critical history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredEvents = events.filter((e) => {
    const matchesType = filterType === "all" || e.type === filterType;
    
    if (filterDate === "all") return matchesType;
    
    const eventDate = new Date(e.timestamp);
    const now = new Date();
    
    if (filterDate === "today") {
      return matchesType && eventDate.toDateString() === now.toDateString();
    }
    
    if (filterDate === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return matchesType && e.timestamp > weekAgo.getTime();
    }

    if (filterDate === "custom" && startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return matchesType && e.timestamp >= start.getTime() && e.timestamp <= end.getTime();
    }
    
    return matchesType;
  });

  // Data for chart
  const types = ["CPU", "RAM", "DISK", "TEMPERATURE"];
  const chartData = types.map((type) => ({
    name: type === "TEMPERATURE" ? "Calor" : type,
    count: events.filter((e) => e.type === type).length,
  })).filter(d => d.count > 0 || d.name === "CPU");

  // Data for Timeline Chart
  const timelineData = events.reduce((acc: { name: string; total: number }[], event) => {
    const date = new Date(event.timestamp).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
    const existing = acc.find(item => item.name === date);
    if (existing) {
      existing.total += 1;
    } else {
      acc.push({ name: date, total: 1 });
    }
    return acc;
  }, []).reverse();

  const COLORS_VALUES = ["#ef4444", "#f97316", "#3b82f6", "#dc2626"];
  const COLORS = {
    CPU: "#ef4444",
    RAM: "#f97316",
    DISK: "#3b82f6",
    TEMPERATURE: "#dc2626",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historial Crítico</h1>
          <p className="text-muted-foreground">
            Registro de sobrecargas y eventos críticos detectados en {hostname}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-37.5">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="CPU">CPU</SelectItem>
                <SelectItem value="RAM">RAM</SelectItem>
                <SelectItem value="DISK">Disco</SelectItem>
                <SelectItem value="TEMPERATURE">Calentamiento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={filterDate} onValueChange={setFilterDate}>
              <SelectTrigger className="w-37.5">
                <SelectValue placeholder="Fecha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Cualquier fecha</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Últimos 7 días</SelectItem>
                <SelectItem value="custom">Rango personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filterDate === "custom" && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-35 h-9"
              />
              <span className="text-muted-foreground">a</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-35 h-9"
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Eventos Registrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {filteredEvents.length === 0 ? (
                    <p className="text-center text-muted-foreground py-10"> No se han detectado eventos críticos aún.</p>
                  ) : (
                    filteredEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start justify-between p-4 rounded-lg border bg-card/50"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 p-2 rounded-full ${event.type === 'CPU' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                            <AlertCircle className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold">{event.message}</p>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(event.timestamp).toLocaleString()}
                              <Badge variant="outline" className="ml-2">
                                Valor: {event.value.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Frecuencia de Sobrecargas</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || "#8884d8"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución Crítica</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {chartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_VALUES[index % COLORS_VALUES.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>Tendencia Temporal</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
