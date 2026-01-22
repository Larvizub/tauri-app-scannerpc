import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Endpoint para obtener las últimas métricas de un dispositivo.
 */
export const getLatestMetrics = functions.https.onRequest(async (req: functions.https.Request, res: any) => {
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
  } catch (error) {
    res.status(500).send("Error al obtener datos");
  }
});

/**
 * Endpoint para enviar alertas externas.
 */
export const postExternalAlert = functions.https.onRequest(async (req: functions.https.Request, res: any) => {
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
  } catch (error) {
    res.status(500).send("Error al guardar alerta");
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
    } catch (err) {
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
