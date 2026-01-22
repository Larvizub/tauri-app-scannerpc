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
      source: "external-api"
    });

    res.status(200).send("Alerta registrada");
  } catch (error) {
    res.status(500).send("Error al guardar alerta");
  }
});
