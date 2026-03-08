# API Externa ScannerPC

Esta documentacion describe como conectar cualquier software web (frontend, backend o integracion de terceros) con el API HTTP de ScannerPC expuesto por Firebase Functions.

## 1. URL base

Usa esta plantilla:

`https://<region>-<project-id>.cloudfunctions.net`

Ejemplo:

`https://us-central1-mi-proyecto.cloudfunctions.net`

## 2. Autenticacion soportada

Todos los endpoints requieren autenticacion. El backend acepta dos modos:

- `Authorization: Bearer <ID_TOKEN>`
  - Recomendado para aplicaciones web con usuarios autenticados por Firebase Auth.
- `x-api-key: <FUNCTIONS_API_KEY>`
  - Recomendado para integraciones servidor a servidor.

La funcion valida primero el ID Token (`verifyIdToken`) y, si no existe, intenta validar `x-api-key` contra `FUNCTIONS_API_KEY`.

## 3. Compatibilidad web (navegadores)

Si llamas el API directamente desde navegador, debes configurar CORS en Firebase Functions. Si no, el navegador puede bloquear la peticion por politica de origen cruzado.

Opciones recomendadas:

- Opcion A: habilitar CORS en Functions y restringir origenes permitidos.
- Opcion B: consumir este API desde tu backend y exponer un proxy interno a tu frontend.

## 4. Convenciones generales

- `Content-Type` para POST: `application/json`.
- `timestamp` se maneja como epoch en milisegundos.
- `deviceId` es el identificador del equipo (normalmente hostname).
- Respuestas de lectura desde RTDB pueden venir como objeto indexado por llave (`{"-N...": {...}}`) o `null` si no hay datos.

## 5. Catalogo de endpoints

### 5.1 GET `/getLatestMetrics?deviceId={deviceId}`

Obtiene la ultima metrica disponible del dispositivo.

Respuesta `200` (ejemplo):

```json
{
  "-Nxyz": {
    "cpu_usage": 45.2,
    "memory_usage_pct": 60.1,
    "total_memory": 17179869184,
    "used_memory": 8589934592,
    "network_rx": 1024556,
    "network_tx": 512223,
    "network_rx_bps": 12500.5,
    "network_tx_bps": 5000.2,
    "disks": [
      {
        "name": "/",
        "total": 500000000,
        "available": 200000000
      }
    ],
    "timestamp": 1674384000000
  }
}
```

### 5.2 GET `/getInstalledApps?deviceId={deviceId}`

Obtiene inventario de aplicaciones instaladas del dispositivo.

Respuesta `200` (ejemplo):

```json
{
  "apps": [
    { "name": "Visual Studio Code", "version": "N/A" },
    { "name": "Spotify", "version": "N/A" }
  ],
  "lastUpdate": 1674384000000
}
```

### 5.3 GET `/getRunningProcesses?deviceId={deviceId}`

Obtiene procesos en ejecucion reportados para el dispositivo.

Respuesta `200` (ejemplo):

```json
{
  "processes": [
    {
      "pid": "1287",
      "name": "Google Chrome",
      "cpu_usage": 14.3,
      "memory_bytes": 524288000,
      "status": "Run"
    }
  ],
  "lastUpdate": 1674384000000,
  "source": "user:abc123"
}
```

### 5.4 GET `/getCriticalHistory?deviceId={deviceId}`

Obtiene hasta los ultimos 100 eventos criticos para el dispositivo.

Respuesta `200` (ejemplo):

```json
{
  "-UniqueEventID": {
    "type": "CPU",
    "value": 92.5,
    "threshold": 90,
    "message": "Uso de CPU critico (>90%)",
    "timestamp": 1674384000000
  }
}
```

### 5.5 GET `/listDevices`

Lista dispositivos registrados en RTDB.

Respuesta `200` (ejemplo):

```json
{
  "MacBook-Luis": {
    "hostname": "MacBook-Luis",
    "lastSeen": 1674384000000,
    "os": "darwin"
  }
}
```

### 5.6 POST `/postExternalAlert`

Registra una alerta externa.

Body:

```json
{
  "deviceId": "pc-pro-01",
  "message": "Reinicio programado por mantenimiento",
  "level": "warning"
}
```

Campos:

- `deviceId` (string, requerido)
- `message` (string, requerido)
- `level` (string, opcional, default `info`)

Respuesta `200`:

`Alerta registrada`

### 5.7 POST `/postRunningProcesses`

Actualiza el estado de procesos en ejecucion para un dispositivo.

Body:

```json
{
  "deviceId": "pc-pro-01",
  "processes": [
    {
      "pid": "1287",
      "name": "Google Chrome",
      "cpu_usage": 14.3,
      "memory_bytes": 524288000,
      "status": "Run"
    }
  ]
}
```

Campos:

- `deviceId` (string, requerido)
- `processes` (array, requerido)
- `processes[].pid` (string, requerido)
- `processes[].name` (string, requerido)
- `processes[].cpu_usage` (number, opcional)
- `processes[].memory_bytes` (number, opcional)
- `processes[].status` (string, opcional)

Respuesta `200`:

`Procesos actualizados`

## 6. Errores HTTP

Codigos comunes del API:

- `400`: faltan datos requeridos (por ejemplo `deviceId`).
- `401`: no autorizado (token o api key invalida/ausente).
- `405`: metodo HTTP no permitido (solo aplica en POST).
- `500`: error interno al leer o escribir en RTDB.

## 7. Quickstart para cualquier software web

### 7.1 Cliente web con Firebase Auth (Bearer Token)

```ts
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "..."
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function getMetrics(deviceId: string) {
  const cred = await signInWithEmailAndPassword(auth, "user@email.com", "password");
  const idToken = await cred.user.getIdToken();

  const res = await fetch(
    `https://<region>-<project-id>.cloudfunctions.net/getLatestMetrics?deviceId=${encodeURIComponent(deviceId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    }
  );

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}
```

### 7.2 Backend web (Node/Express, Next API, Laravel, etc.) con API Key

```ts
async function postAlert(deviceId: string, message: string) {
  const res = await fetch("https://<region>-<project-id>.cloudfunctions.net/postExternalAlert", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.SCANNERPC_API_KEY as string
    },
    body: JSON.stringify({
      deviceId,
      message,
      level: "warning"
    })
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.text();
}
```

## 8. Ejemplos curl

GET con Bearer:

```bash
curl -H "Authorization: Bearer <ID_TOKEN>" \
  "https://<region>-<project-id>.cloudfunctions.net/getRunningProcesses?deviceId=pc-01"
```

POST con API key:

```bash
curl -X POST "https://<region>-<project-id>.cloudfunctions.net/postRunningProcesses" \
  -H "Content-Type: application/json" \
  -H "x-api-key: <FUNCTIONS_API_KEY>" \
  -d '{"deviceId":"pc-01","processes":[{"pid":"321","name":"Code","cpu_usage":5.2,"memory_bytes":232783872,"status":"Run"}]}'
```

## 9. Checklist de integracion

- Definir URL base segun tu region/proyecto.
- Elegir autenticacion (Bearer para frontend autenticado, API key para backend).
- Asegurar CORS si el consumo es directo desde navegador.
- Manejar estados HTTP (`400/401/405/500`) en cliente.
- Aplicar rotacion y resguardo de secretos (`FUNCTIONS_API_KEY`).
