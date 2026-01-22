---
applyTo: '**'
---

# Construcción del app Tauri

-Vas a construir la aplicación en tauri con bun.
-Vas a instalar cualquier requerimiento previo para que bun y tauri funcionen correctamente.
-Vas a utilizar React como framework de frontend con TypeScript.
-Vas a utilizar los estilos con Tailwind CSS y shadcn UI.
-Debe contar con tema claro y oscuro y detectar el sistema del usuario para aplicarlo automáticamente.
-La aplicación utilizará Firebase como BaaS.
-La aplicación utilizará base de datos en tiempo real con RTDB de Firebase y Functions para el backend.
-La aplicación debe poder instalarse en Windows, macOS y Linux.
-La aplicación debe tener un instalador para cada sistema operativo.
-Debes generar un API para que la información del usuario pueda ser enviada y recibida desde una aplicación web externa y generar toda la documentación necesaria para que otros desarrolladores puedan utilizarla, Por tal motivo se necesita Firebase Functions.

# Detalles de la Aplicación

-La aplicación debe tener una interfaz moderna y responsiva.
-La aplicación se trata de rastrear el funcionamiento de la computadora y mostrar estadísticas en tiempo real.
-La aplicación debe mostrar el uso de CPU, memoria, disco y red en tiempo real.
-La aplicación debe indicar cuando el usuario tenga problemas de calentamiento y mal rendimiento de la computadora.
-Debe contar con un Dasboard principal que muestre las estadísticas en tiempo real.
-Debe Contar con un modulo de alertas donde se puedan configurar notificaciones para ciertos eventos (ejemplo: uso de CPU mayor al 90% por más de 5 minutos).
-Debe contar con un modulo de Reportes donde se puedan ver estadísticas históricas y gráficas del rendimiento de la computadora.

# Plan de Trabajo

Plan: App Tauri “ScannerPC” end-to-end
Crear un proyecto Tauri con Bun + React/TypeScript, UI moderna con Tailwind + shadcn, tema claro/oscuro automático, telemetría del sistema en tiempo real (CPU/RAM/disco/red) desde Rust y persistencia/automatización con Firebase (RTDB + Functions). El flujo se divide en: base del proyecto, captura/streaming de métricas, UI (Dashboard/Alertas/Reportes), backend (RTDB + API en Functions + documentación) y empaquetado multiplataforma, manteniendo el código “sin errores” mediante checks continuos (TypeScript, lint y Rust).

Steps 1. Inicializar base (Bun + Tauri + React TS + UI)
Auditar si el repo ya tiene scaffold y alinear scripts en package.json para bun, tauri, typecheck y lint.
Configurar Tailwind + shadcn y tema claro/oscuro auto en src/main.tsx y src/components/theme-provider.tsx.
Definir layout/rutas (Dashboard/Alertas/Reportes) y componentes base en src/App.tsx y src/routes.
Steps 2. Métricas del sistema en Rust y puente a UI
Implementar recolección de CPU/memoria/disco/red (y temperatura si está disponible) en src-tauri/src/main.rs usando crates tipo sysinfo y una tarea periódica.
Exponer comandos/eventos Tauri para “push” de métricas a React y normalizar el shape de datos en src/lib/telemetry.ts.
Definir umbrales de “calentamiento/mal rendimiento” (reglas) en src/lib/healthRules.ts y emitir estados/alertas.
Steps 3. Dashboard en tiempo real + Alertas configurables
Construir Dashboard con tarjetas y gráficas live (CPU/RAM/disco/red) usando shadcn + charts en src/pages/Dashboard.tsx.
Implementar módulo de Alertas (reglas tipo “CPU > 90% por 5 min”) con persistencia local y en RTDB en src/pages/Alerts.tsx.
Integrar notificaciones (in-app y del sistema) con Tauri en src/lib/notifications.ts.
Steps 4. Reportes históricos + Firebase RTDB (BaaS)
Inicializar Firebase en src/lib/firebase.ts y modelar RTDB (por usuario/dispositivo/fecha) para evitar lecturas grandes.
Guardar métricas agregadas (p.ej. cada 10–60s) y eventos de alertas en RTDB desde la app.
Construir Reportes con rangos de tiempo y gráficas históricas en src/pages/Reports.tsx consultando RTDB de forma paginada/por ventanas.
Steps 5. Firebase Functions: API externa + documentación
Crear Functions (TypeScript) con endpoints para enviar/recibir datos de usuario/métricas/alertas en functions/src/index.ts.
Asegurar auth/autorización (Firebase Auth/JWT) y reglas RTDB en database.rules.json.
Documentar API (endpoints, auth, ejemplos, modelos) en docs/api.md y un README de despliegue en README.md.
Steps 6. Instaladores multiplataforma + “cero errores” continuo
Configurar empaquetado y metadatos en src-tauri/tauri.conf.json para Windows/macOS/Linux (MSI/DMG/AppImage según target).
Asegurar prerequisitos por SO (toolchains) y pipeline de build local en README.md.
Mantener checks obligatorios en CI o scripts locales: bun run typecheck, bun run lint, bunx tauri build, cargo check (según scripts definidos en package.json).