import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Endpoint para obtener las últimas métricas de un dispositivo.
 */
export const getLatestMetrics = functions.runWith({ secrets: ["FUNCTIONS_API_KEY"] }).https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
  const deviceId = req.query.deviceId as string;

  if (!deviceId) {
    res.status(400).send("Falta deviceId");
    return;
  }

  // Autenticación: verificar ID token de Firebase o clave de servicio
  const authResult = await authenticateRequest(req);
  if (!authResult) {
    res.status(401).send("No autorizado");
    return;
  }

  try {
    const snapshot = await admin.database()
      .ref(`metrics/${deviceId}`)
      .orderByChild("timestamp")
      .limitToLast(1)
      .once("value");

    res.status(200).json(snapshot.val());
  } catch (_error) {
    console.error("Error al obtener datos:", _error);
    res.status(500).send("Error al obtener datos");
  }
});

/**
 * Endpoint para obtener las aplicaciones instaladas de un dispositivo.
 */
export const getInstalledApps = functions.runWith({ secrets: ["FUNCTIONS_API_KEY"] }).https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
  const deviceId = req.query.deviceId as string;

  if (!deviceId) {
    res.status(400).send("Falta deviceId");
    return;
  }

  const authResult = await authenticateRequest(req);
  if (!authResult) {
    res.status(401).send("No autorizado");
    return;
  }

  try {
    const snapshot = await admin.database()
      .ref(`installed_apps/${deviceId}`)
      .once("value");

    res.status(200).json(snapshot.val());
  } catch (_error) {
    console.error("Error al obtener aplicaciones:", _error);
    res.status(500).send("Error al obtener aplicaciones");
  }
});

/**
 * Endpoint para obtener los programas en ejecución de un dispositivo.
 */
export const getRunningProcesses = functions.runWith({ secrets: ["FUNCTIONS_API_KEY"] }).https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
  const deviceId = req.query.deviceId as string;

  if (!deviceId) {
    res.status(400).send("Falta deviceId");
    return;
  }

  const authResult = await authenticateRequest(req);
  if (!authResult) {
    res.status(401).send("No autorizado");
    return;
  }

  try {
    const snapshot = await admin.database()
      .ref(`running_processes/${deviceId}`)
      .once("value");

    res.status(200).json(snapshot.val());
  } catch (_error) {
    console.error("Error al obtener procesos en ejecución:", _error);
    res.status(500).send("Error al obtener procesos en ejecución");
  }
});

/**
 * Endpoint para obtener el historial crítico de un dispositivo.
 */
export const getCriticalHistory = functions.runWith({ secrets: ["FUNCTIONS_API_KEY"] }).https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
  const deviceId = req.query.deviceId as string;

  if (!deviceId) {
    res.status(400).send("Falta deviceId");
    return;
  }

  const authResult = await authenticateRequest(req);
  if (!authResult) {
    res.status(401).send("No autorizado");
    return;
  }

  try {
    const snapshot = await admin.database()
      .ref(`critical_history/${deviceId}`)
      .orderByChild("timestamp")
      .limitToLast(100)
      .once("value");

    res.status(200).json(snapshot.val());
  } catch (_error) {
    console.error("Error al obtener historial crítico:", _error);
    res.status(500).send("Error al obtener historial crítico");
  }
});

/**
 * Endpoint para listar todos los dispositivos (usuarios) registrados.
 */
export const listDevices = functions.runWith({ secrets: ["FUNCTIONS_API_KEY"] }).https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
  const authResult = await authenticateRequest(req);
  if (!authResult) {
    res.status(401).send("No autorizado");
    return;
  }

  try {
    const snapshot = await admin.database()
      .ref("devices")
      .once("value");

    res.status(200).json(snapshot.val());
  } catch (_error) {
    console.error("Error al obtener lista de dispositivos:", _error);
    res.status(500).send("Error al obtener lista de dispositivos");
  }
});

/**
 * Endpoint para enviar alertas externas.
 */
export const postExternalAlert = functions.runWith({ secrets: ["FUNCTIONS_API_KEY"] }).https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
  if (req.method !== "POST") {
    res.status(405).send("Método no permitido");
    return;
  }
  // Autenticación: verificar ID token de Firebase o clave de servicio
  const authResult = await authenticateRequest(req);
  if (!authResult) {
    res.status(401).send("No autorizado");
    return;
  }

  const { deviceId, message, level } = req.body;

  if (!deviceId || !message) {
    res.status(400).send("Datos incompletos");
    return;
  }

  try {
    await admin.database().ref(`alerts/${deviceId}`).push({
      message,
      level: level || "info",
      timestamp: admin.database.ServerValue.TIMESTAMP,
      source: authResult.uid ? `user:${authResult.uid}` : "external-api"
    });

    res.status(200).send("Alerta registrada");
  } catch (_error) {
    console.error("Error al guardar alerta:", _error);
    res.status(500).send("Error al guardar alerta");
  }
});

/**
 * Endpoint para enviar/actualizar programas en ejecución desde sistemas externos.
 */
export const postRunningProcesses = functions.runWith({ secrets: ["FUNCTIONS_API_KEY"] }).https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
  if (req.method !== "POST") {
    res.status(405).send("Método no permitido");
    return;
  }

  const authResult = await authenticateRequest(req);
  if (!authResult) {
    res.status(401).send("No autorizado");
    return;
  }

  const { deviceId, processes } = req.body as {
    deviceId?: string;
    processes?: Array<{
      pid: string;
      name: string;
      cpu_usage?: number;
      memory_bytes?: number;
      status?: string;
    }>;
  };

  if (!deviceId || !Array.isArray(processes)) {
    res.status(400).send("Datos incompletos");
    return;
  }

  try {
    await admin.database().ref(`running_processes/${deviceId}`).set({
      processes,
      lastUpdate: admin.database.ServerValue.TIMESTAMP,
      source: authResult.uid ? `user:${authResult.uid}` : "external-api"
    });

    res.status(200).send("Procesos actualizados");
  } catch (_error) {
    console.error("Error al guardar procesos en ejecución:", _error);
    res.status(500).send("Error al guardar procesos en ejecución");
  }
});

/**
 * Helper: autentica la request usando un ID token de Firebase (Authorization: Bearer <idToken>)
 * o mediante una clave estática en `process.env.FUNCTIONS_API_KEY` pasada como `x-api-key`.
 */
async function authenticateRequest(req: functions.https.Request) {
  const authHeader = (req.get('Authorization') || '') as string;
  if (authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.split(' ')[1];
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      return { uid: decoded.uid };
    } catch (_err) {
      console.error("Error al verificar token:", _err);
      return null;
    }
  }

  // fallback: api key
  const apiKey = process.env.FUNCTIONS_API_KEY;
  const xApiKey = (req.get('x-api-key') || req.get('X-API-KEY')) as string | undefined;
  if (apiKey && xApiKey && xApiKey === apiKey) {
    return { service: true };
  }

  return null;
}
