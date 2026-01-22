import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set } from "firebase/database";

// Reemplaza con tus credenciales reales de Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
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
