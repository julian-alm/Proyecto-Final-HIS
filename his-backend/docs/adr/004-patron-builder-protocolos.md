# ADR-008: Uso del Patrón Builder para Generación Dinámica de Protocolos de Enfermería

* **Estado:** Aceptado
* **Fecha:** 19/10/2026

## Contexto y Problema
En el módulo de Cuidados de Enfermería (`nursing-care`), cuando un paciente es ingresado, el sistema debe generar automáticamente tareas específicas dependiendo del motivo de admisión (ej. Cirugía Programada vs. Neumonía). Utilizar estructuras condicionales gigantes (`if/switch`) dentro del Caso de Uso para armar estos protocolos generaría un código difícil de mantener y violaría el Principio de Abierto/Cerrado (OCP).

## Decisión
Se implementó el **Patrón de Diseño Creacional Builder** (GoF) para delegar la construcción paso a paso de los protocolos. 
Se creó una interfaz abstracta y constructores concretos (ej. `PreOpProtocolBuilder` y `RespiratoryProtocolBuilder`). El `GenerateCareProtocolUseCase` actúa como un "Director" que invoca al builder correspondiente según la razón de ingreso, garantizando que el protocolo se ensamble con las tareas correctas ("Verificar ayuno", "Aislamiento de contacto", etc.) antes de persistirlo.

## Trade-offs (Compromisos Asumidos)
* **Positivo (Ganancia):** Alta escalabilidad. Para agregar un nuevo protocolo en el futuro (ej. Ingreso por Traumatismo), solo se debe crear un nuevo Builder sin modificar la lógica central del Caso de Uso (cumple OCP).
* **Positivo (Ganancia):** Código limpio y responsabilidades separadas (SRP). El Caso de Uso orquesta, el Builder construye.
* **Negativo (Costo):** Aumenta ligeramente la cantidad de clases y archivos en el dominio (`builders`, `interfaces`), sumando un poco de "boilerplate" inicial.