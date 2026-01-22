# Documentación del API Externa - ScannerPC

Este API permite a aplicaciones externas interactuar con los datos de telemetría y alertas de los usuarios.

## Base URL
`https://<region>-<project-id>.cloudfunctions.net/`

## Endpoints

### 1. Obtener últimas métricas
`GET /getLatestMetrics?deviceId={deviceId}`

**Parámetros:**
- `deviceId` (string): Identificador único de la computadora.

**Respuesta (200 OK):**
```json
{
  "-Nxyz...": {
    "cpu_usage": 45.2,
    "memory_usage_pct": 60.1,
    "timestamp": 1674384000000,
    ...
  }
}
```

### 2. Enviar Alerta Externa
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
Actualmente el API requiere que las reglas de Firebase RTDB permitan el acceso. En producción, se recomienda usar `Authorization: Bearer <ID_TOKEN>`.
