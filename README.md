# ScannerPC - Rastreador de Rendimiento

ScannerPC es una aplicación de escritorio multiplataforma (Windows, macOS, Linux) construida con **Tauri**, **React**, **TypeScript** y **Rust**. Permite monitorear el rendimiento de la computadora en tiempo real y sincronizar los datos con la nube mediante Firebase.

## Características Principales

- **Dashboard en Tiempo Real:** Visualización de uso de CPU, Memoria RAM, Almacenamiento y Red (con cálculo de velocidad de transferencia en macOS mediante netstat fallback).
- **Inventario de Aplicaciones:** Listado completo de las aplicaciones instaladas en el sistema.
- **Monitor de Ejecución:** Vista en tiempo real de programas/procesos en ejecución (PID, CPU, RAM y estado).
- **Identidad sin Contraseña:** La aplicación utiliza el nombre del equipo (`hostname`) como identificador único para sincronizar configuraciones y métricas de forma anónima pero persistente.
- **Alertas Configurables:** Módulo para establecer umbrales de rendimiento y recibir notificaciones.
- **Sincronización Cloud:** Persistencia de datos en Firebase Realtime Database para análisis histórico.
- **API Externa:** Endpoints disponibles a través de Firebase Functions para consultar y actualizar datos desde aplicaciones web externas (incluye aplicaciones instaladas y programas en ejecución) con autenticación mediante API Key o Bearer Token.

## Requisitos Previos

- [Bun](https://bun.sh/)
- [Rust](https://www.rust-lang.org/)
- [Tauri v2 Prerrequisitos](https://v2.tauri.app/start/prerequisites/)

## Instalación y Desarrollo

1. Instalar dependencias:
   ```bash
   bun install
   ```

2. Ejecutar la aplicación en modo desarrollo:
   ```bash
   bun tauri dev
   ```

3. Construir la aplicación para producción:
   ```bash
   bun tauri build
   ```

## Arquitectura del Proyecto

- `src/`: Frontend en React + Tailwind CSS + shadcn/ui.
- `src-tauri/`: Backend en Rust que maneja la telemetría del sistema y los comandos nativos.
- `functions/`: Cloud Functions para el API externa.
- `docs/`: Documentación detallada del API.

## Documentación del API

Consulta la documentación completa en [docs/api.md](docs/api.md).

## Licencia

Este proyecto está bajo la licencia MIT.

