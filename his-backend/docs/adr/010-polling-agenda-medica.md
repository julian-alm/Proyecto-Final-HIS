# ADR-014: Sincronización de Agenda Médica mediante Polling

* **Estado:** Aceptado
* **Fecha:** 15/11/2026

## Contexto y Problema
La vista de la agenda del médico (`DoctorAgendaView`) es un componente de naturaleza colaborativa: debe reflejar en tiempo real los pacientes que el área de Admisión va derivando al estado "EN_SALA_DE_ESPERA" o marcando como "Entreturnos". Dado que el protocolo HTTP tradicional es unidireccional (el cliente pide, el servidor responde), el frontend no se enteraría de los nuevos turnos a menos que el médico recargara manualmente la página, afectando gravemente la operatividad de la clínica.

## Decisión
Como solución pragmática y efectiva para la iteración actual del proyecto, se implementó una estrategia de **Polling**.
Se utiliza la función `setInterval` enganchada al ciclo de vida `onMounted` del componente. Cada 30 segundos, el frontend ejecuta silenciosamente la función `fetchAgenda()`, consultando a la API por los datos más recientes y renderizando los cambios, deteniendo el ciclo al ejecutarse el `onUnmounted` (cuando el médico cambia de pantalla).

## Trade-offs (Compromisos Asumidos)
* **Positivo (Ganancia):** Implementación extremadamente rápida, sencilla y funcional que no requiere reconfigurar la infraestructura del servidor (no se necesitan servidores dedicados para WebSockets ni mantener conexiones TCP abiertas persistentes en el backend).
* **Negativo (Deuda Técnica):** Ineficiencia a nivel de red y procesamiento. Genera tráfico repetitivo e inútil (junto con consultas innecesarias a la base de datos PostgreSQL) en los momentos donde la agenda no ha sufrido ningún cambio real.
* **Nota de Evolución:** Se documenta y acepta como deuda técnica planificada. Para una futura versión del sistema con alta concurrencia de usuarios, la arquitectura deberá refactorizarse hacia una solución basada en eventos en tiempo real, como *Server-Sent Events (SSE)* o *WebSockets*, donde sea el servidor quien empuje (push) la notificación al cliente exclusivamente cuando ocurra un cambio de estado.