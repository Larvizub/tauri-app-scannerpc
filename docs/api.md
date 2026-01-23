# Documentación del API Externa - ScannerPC

Este API permite a aplicaciones externas interactuar con los datos de telemetría y alertas de los usuarios.

## Base URL
`https://<region>-<project-id>.cloudfunctions.net/`

## Endpoints

### 1. Obtener últimas métricas
`GET /getLatestMetrics?deviceId={deviceId}`

**Parámetros:**
- `deviceId` (string): Identificador único de la computadora (hostname).

**Respuesta (200 OK):**
```json
{
  "-Nxyz...": {
    "cpu_usage": 45.2,
    "memory_usage_pct": 60.1,
    "total_memory": 17179869184,
    "used_memory": 8589934592,
    "network_rx": 1024556,
    "network_tx": 512223,
    "network_rx_bps": 12500.5,
    "network_tx_bps": 5000.2,
    "disks": [
      { "name": "/", "total": 500000000, "available": 200000000 }
    ],
    "timestamp": 1674384000000
  }
}
```

### 2. Obtener aplicaciones instaladas
`GET /getInstalledApps?deviceId={deviceId}`

**Parámetros:**
- `deviceId` (string): Identificador único de la computadora (hostname).

**Respuesta (200 OK):**
```json
{
  "apps": [
    { "name": "Visual Studio Code", "version": "N/A" },
    { "name": "Spotify", "version": "N/A" }
  ],
  "lastUpdate": 1674384000000
}
```

### 3. Enviar Alerta Externa
`POST /postExternalAlert`

**Body:**
```json
{
  "deviceId": "pc-pro-01",
  "message": "Reinicio programado por mantenimiento",
  "level": "warning"
}
```

**Respuesta (200 OK):**
`Alerta registrada`

## Autenticación
Este API ahora requiere autenticación para proteger el acceso. A continuación tienes instrucciones prácticas para implementarlo desde una web externa o servidor.

Opciones soportadas (ordenadas por recomendación):

- Firebase ID Token (recomendado para clientes web)

  - Flujo resumido:
    1. El usuario se autentica en el cliente (Firebase Auth: email/password, OAuth providers, etc.).
    2. El cliente obtiene el ID token con `await user.getIdToken()`.
    3. El cliente incluye el token en la cabecera `Authorization: Bearer <ID_TOKEN>` al llamar a la Function.

  - Ejemplo (cliente web, Firebase v9 modular):

  ```javascript
  import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'

  const auth = getAuth()
  const cred = await signInWithEmailAndPassword(auth, email, password)
  const idToken = await cred.user.getIdToken()

  const res = await fetch(`https://<region>-<project>.cloudfunctions.net/getLatestMetrics?deviceId=pc-01`, {
    headers: { 'Authorization': `Bearer ${idToken}` }
  })
  const data = await res.json()
  ```

  - Nota: si el cliente usa OAuth (Google, GitHub, etc.) el flujo es similar: tras el login obtienes `user` y `user.getIdToken()`.

- API key (para integraciones servidor-a-servidor o servicios de confianza)

  - Flujo resumido:
    1. Genera una clave secreta (p. ej. 32+ bytes aleatorios).
    2. Guarda la clave como variable de entorno `FUNCTIONS_API_KEY` en el entorno de tus Cloud Functions.
    3. El servidor que integra envía la cabecera `x-api-key: <FUNCTIONS_API_KEY>` en cada petición.

  - Ejemplo (curl):

  ```bash
  curl -X POST https://<region>-<project>.cloudfunctions.net/postExternalAlert \
    -H "Content-Type: application/json" \
    -H "x-api-key: <FUNCTIONS_API_KEY>" \
    -d '{"deviceId":"pc-01","message":"Reiniciar mañana","level":"warning"}'
  ```

  - Cómo configurar `FUNCTIONS_API_KEY`:
    - Firebase Console: entra a tu Function → Configuration → Environment variables y añade `FUNCTIONS_API_KEY`.
    - Con `gcloud` al desplegar: `gcloud functions deploy <NAME> --set-env-vars FUNCTIONS_API_KEY="<value>"`.

Implementación en el servidor (qué valida la Function)

- Las Functions del proyecto validan primero un ID token mediante `admin.auth().verifyIdToken(idToken)` y, como fallback, aceptan `x-api-key` cuando coincide con `process.env.FUNCTIONS_API_KEY`.

Buenas prácticas de seguridad

- Para clientes web, usa Firebase Auth: permite revocación de sesiones, reglas de acceso y control fino por usuario.
- Evita exponer `FUNCTIONS_API_KEY` en código público. Úsala solo en servidores de confianza.
- Rota la clave periódicamente y audita su uso.
- Habilita CORS en las Functions si las va a consumir un navegador directamente; restringe `Access-Control-Allow-Origin` a tus dominios.

Ejemplos rápidos

Obtener métricas (con ID token):
```bash
curl -H "Authorization: Bearer <ID_TOKEN>" "https://<region>-<project>.cloudfunctions.net/getLatestMetrics?deviceId=pc-01"
```

Enviar alerta (con API key):
```bash
curl -X POST https://<region>-<project>.cloudfunctions.net/postExternalAlert \
  -H "Content-Type: application/json" \
  -H "x-api-key: <FUNCTIONS_API_KEY>" \
  -d '{"deviceId":"pc-01","message":"Prueba","level":"info"}'
```
