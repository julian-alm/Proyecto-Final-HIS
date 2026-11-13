# ADR-010: Separación de Bounded Contexts entre Cuidados de Enfermería y Registro Médico (EHR)

* **Estado:** Aceptado
* **Fecha:** 19/10/2026

## Contexto y Problema
En el desarrollo del sistema clínico, existía la tendencia natural de agrupar todas las interacciones relacionadas con la salud del paciente (signos vitales, medicación, evoluciones médicas) dentro de un único gran módulo de Historia Clínica Electrónica (`ehr`). Sin embargo, el flujo de trabajo diario de enfermería (operativo, en tiempo real, orientado a tareas) tiene reglas de negocio y ciclos de vida muy distintos a los del registro médico histórico consolidado. Agrupar todo generaría un "Monolito de Dominio" difícil de mantener y con alta colisión de código.

## Decisión
Basados en los principios de Domain-Driven Design (DDD), decidimos separar estas áreas en dos *Bounded Contexts* distintos:
1. **`nursing-care` (Cuidados de Enfermería):** Un subdominio operativo encargado de la administración de medicamentos, control de signos vitales en tiempo real y ejecución de protocolos de cuidado.
2. **`ehr` (Historia Clínica Electrónica):** Un subdominio central/histórico encargado de almacenar el legajo médico, evoluciones, diagnósticos y consolidar los eventos clínicos importantes.

## Trade-offs (Compromisos Asumidos)
* **Positivo (Ganancia):** Alta cohesión y bajo acoplamiento. Los módulos pueden evolucionar a distintas velocidades y ser mantenidos por diferentes desarrolladores sin conflictos.
* **Positivo (Ganancia):** Protección del modelo de dominio. Las entidades de enfermería no se contaminan con propiedades exclusivas de auditoría médica.
* **Negativo (Costo):** Requiere integración a través de Eventos de Dominio (ej. `nursing-care` emite un evento de alerta que `ehr` debe escuchar y registrar) en lugar de una simple llamada a base de datos compartida.
