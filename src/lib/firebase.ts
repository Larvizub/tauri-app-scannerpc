import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set, get } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

interface SystemStats {
  cpu_usage: number;
  memory_usage_pct: number;
  used_memory: number;
  total_memory: number;
  network_rx: number;
  network_rx_bps?: number;
  disks: DiskInfo[];
}

interface DiskInfo {
  name: string;
  total_space: number;
  used_space: number;
}

interface AppInfo {
  name: string;
  version?: string;
  path?: string;
}

interface CriticalEvent {
  type: string;
  details: string;
  timestamp?: number;
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

/**
 * Autentica al usuario de forma anónima para tener una sesión activa.
 */
export const loginAnonymously = () => signInAnonymously(auth);

/**
 * Obtiene el ID Token del usuario actual (útil para llamar a las Functions).
 */
export const getIdToken = () => auth.currentUser?.getIdToken();

export async function saveMetrics(deviceId: string, stats: SystemStats) {
  const metricsRef = ref(db, `metrics/${deviceId}/${new Date().toISOString().split('T')[0]}`);
  const newMetricRef = push(metricsRef);
  await set(newMetricRef, {
    ...stats,
    timestamp: Date.now()
  });
}

/**
 * Guarda el listado de aplicaciones instaladas.
 */
export async function saveInstalledApps(deviceId: string, apps: AppInfo[]) {
  const appsRef = ref(db, `installed_apps/${deviceId}`);
  await set(appsRef, {
    apps,
    lastUpdate: Date.now()
  });
}

/**
 * Guarda un evento crítico de rendimiento.
 */
export async function saveCriticalEvent(deviceId: string, event: CriticalEvent) {
  const eventsRef = ref(db, `critical_history/${deviceId}`);
  const newEventRef = push(eventsRef);
  await set(newEventRef, {
    ...event,
    timestamp: Date.now()
  });
}

/**
 * Guarda la configuración del equipo.
 */
export async function saveConfig(deviceId: string, config: Record<string, unknown>) {
  const configRef = ref(db, `configs/${deviceId}`);
  await set(configRef, config);
}

/**
 * Registra o actualiza el dispositivo en la lista de usuarios/equipos.
 */
export async function registerDevice(deviceId: string) {
  const deviceRef = ref(db, `devices/${deviceId}`);
  await set(deviceRef, {
    hostname: deviceId,
    lastSeen: Date.now(),
    os: navigator.platform
  });
}

/**
 * Obtiene la configuración del equipo.
 */
export async function getConfig(deviceId: string) {
  const configRef = ref(db, `configs/${deviceId}`);
  const snapshot = await get(configRef);
  return snapshot.val();
}
