# ADR-013: Uso de Pinia como Gestor de Estado Global en Vue 3

* **Estado:** Aceptado
* **Fecha:** 15/11/2026

## Contexto y Problema
En vistas con alta carga de lógica, como `DoctorAgendaView`, el componente necesita conocer qué usuario (médico) está logueado en el sistema para poder solicitar su agenda de turnos específica. Pasar esta información desde el componente raíz (`App.vue`) hacia abajo a través de múltiples capas de propiedades (*Prop Drilling*) ensucia el código, acopla fuertemente componentes que no deberían conocerse entre sí y dificulta la escalabilidad del frontend.

## Decisión
Se decidió adoptar **Pinia** como la biblioteca oficial de gestión de estado global, descartando el uso de Props pasadas en cascada o de la librería anterior del ecosistema (Vuex). 
Se implementó un `authStore` que mantiene en memoria los datos de la sesión del usuario logueado (`userId`, `userFullName`). De este modo, cualquier vista de la aplicación puede importar y consumir directamente estos datos sin depender de su componente padre.

## Trade-offs (Compromisos Asumidos)
* **Positivo (Ganancia):** Arquitectura frontend mucho más limpia, respetando la separación de responsabilidades y evitando el acoplamiento visual entre vistas.
* **Positivo (Ganancia):** Soporte nativo perfecto para TypeScript, brindando autocompletado e inferencia de tipos estricta (una gran ventaja sobre Vuex).
* **Positivo (Ganancia):** Facilita enormemente la inyección de estados simulados en las pruebas unitarias con Vitest a través del plugin `createTestingPinia`.
* **Negativo (Costo):** Agrega una dependencia externa al peso final del bundle (aunque Pinia es modular y muy ligero) y requiere gestionar explícitamente la limpieza de los datos en memoria al momento de cerrar la sesión (logout).