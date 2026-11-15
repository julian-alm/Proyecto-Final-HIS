# ADR-012: Enfoque de Pruebas de Caja Negra y Principio Hermético en el Frontend

* **Estado:** Aceptado
* **Fecha:** 15/11/2026

## Contexto y Problema
El frontend de Admisión (`his-frontend`) necesita una suite de pruebas unitarias robusta y mantenible. En el ecosistema Vue, es común testear el estado interno de las variables reactivas (Caja Blanca). Sin embargo, esto genera pruebas frágiles que se rompen con cualquier refactorización mínima del código, incluso si la interfaz de usuario sigue funcionando correctamente. Además, las pruebas no deben depender de que el servidor backend real o la base de datos estén encendidos para ejecutarse de forma determinista.

## Decisión
Se decidió implementar una estrategia de **Testing de Caja Negra (Blackbox)** combinada con el **Principio Hermético**, utilizando Vitest y Vue Test Utils.
1. **Caja Negra:** Las pruebas interactúan con el DOM simulando estrictamente el comportamiento de un usuario real (escribiendo en inputs de texto, haciendo click en botones de submit) y verificando el resultado renderizado en el HTML (ej. la aparición de un mensaje de éxito o una clase CSS dinámica), ignorando por completo cómo se llaman las variables internas del componente.
2. **Principio Hermético:** Se utilizan dobles de prueba (Mocks con `vi.mock`) para interceptar todas las llamadas al servicio de red (`AdmissionService`), simulando respuestas inmediatas tanto exitosas como fallidas (Happy/Sad Paths).

## Trade-offs (Compromisos Asumidos)
* **Positivo (Ganancia):** Alta resiliencia. El código interno del componente puede refactorizarse libremente; mientras el comportamiento visual externo se mantenga, el test no fallará.
* **Positivo (Ganancia):** Ejecución ultrarrápida (milisegundos) al no depender de latencia de red ni del estado del backend.
* **Negativo (Costo):** Requiere un mayor esfuerzo cognitivo inicial para manejar el asincronismo y simular las esperas de repintado del DOM de Vue (utilizando utilidades como `await nextTick()` y `await flushPromises()`) en comparación con simplemente leer una variable sincrónica.