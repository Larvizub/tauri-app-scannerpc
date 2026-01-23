import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set, get } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

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

export async function saveMetrics(deviceId: string, stats: any) {
  const metricsRef = ref(db, `metrics/${deviceId}/${new Date().toISOString().split('T')[0]}`);
  const newMetricRef = push(metricsRef);
  await set(newMetricRef, {
    ...stats,
    timestamp: Date.now()
  });
}
/**
 * Guarda la configuración del equipo.
 */
export async function saveConfig(deviceId: string, config: any) {
  const configRef = ref(db, `configs/${deviceId}`);
  await set(configRef, config);
}

/**
 * Obtiene la configuración del equipo.
 */
export async function getConfig(deviceId: string) {
  const configRef = ref(db, `configs/${deviceId}`);
  const snapshot = await get(configRef);
  return snapshot.val();
}
