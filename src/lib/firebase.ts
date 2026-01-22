import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set } from "firebase/database";

// Configuración desde variables de entorno (Vite):
// Crea un archivo .env.local con las variables VITE_FIREBASE_* (ver .env.example)
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

export async function saveMetrics(deviceId: string, stats: any) {
  const metricsRef = ref(db, `metrics/${deviceId}/${new Date().toISOString().split('T')[0]}`);
  const newMetricRef = push(metricsRef);
  await set(newMetricRef, {
    ...stats,
    timestamp: Date.now()
  });
}