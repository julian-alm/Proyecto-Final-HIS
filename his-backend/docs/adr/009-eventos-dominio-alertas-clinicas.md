# ADR-009: Arquitectura Orientada a Eventos para Alertas de Signos Vitales Anormales

* **Estado:** Aceptado
* **Fecha:** 19/10/2026

## Contexto y Problema
Al registrar los signos vitales de un paciente (HU 1.1), si un parámetro está fuera de los rangos normales (ej. Temperatura > 39°C), el sistema debe generar una alerta. Si acoplamos la lógica de generación de alertas (notificaciones, registro en HCE) directamente dentro del `RecordVitalSignsUseCase`, el caso de uso tendría demasiadas responsabilidades y el tiempo de respuesta HTTP sería más lento.

## Decisión
Se decidió implementar **Arquitectura Orientada a Eventos (EDA)** utilizando `EventEmitter` de NestJS. 
El caso de uso `RecordVitalSignsUseCase` se limita estrictamente a guardar la medición en la base de datos y, si detecta una anomalía, emite un evento de dominio (ej. `HighTemperatureDetectedEvent`). Un listener independiente (`VitalSignsListener`) captura este evento y procesa la alerta en segundo plano de forma asíncrona.

## Trade-offs (Compromisos Asumidos)
* **Positivo (Ganancia):** Desacoplamiento total. El registro de signos vitales no necesita saber cómo ni a quién se notifica la alerta, respetando el Principio de Responsabilidad Única (SRP).
* **Positivo (Ganancia):** Respuesta HTTP más rápida para el enfermero, ya que la notificación ocurre de manera no bloqueante.
* **Negativo (Costo):** El flujo del código es implícito. Al no ser lineal, la trazabilidad y el "debugging" de un error en las alertas requiere buscar quién escucha el evento en lugar de seguir una simple llamada a función.