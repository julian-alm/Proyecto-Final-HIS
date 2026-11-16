# ADR 013: Simulación del Backend para Tests del Frontend (Mocks)

## Contexto
Teníamos que hacer los tests unitarios de las vistas de Vue (como el candado de la HCE), pero no podíamos depender de tener PostgreSQL levantado y el backend corriendo todo el tiempo para que los tests pasen. Esto hacía que el desarrollo fuera re lento.

## Decisión
Decidimos aislar completamente el frontend para las pruebas usando Vitest. Usamos la función `vi.fn` para "mockear" (simular falsamente) las respuestas que nos daría el backend a través de Axios, y usamos `createTestingPinia` para que el estado global de Vue arranque de cero en cada test.

## Consecuencias
* **Positivas:** Podemos testear el comportamiento del frontend y la seguridad en milisegundos sin importar si el backend está caído o si la base de datos no tiene datos de prueba.
* **Negativas:** Si los chicos del backend cambian la estructura del JSON que devuelve un endpoint, nosotros tenemos que acordarnos de ir a cambiar los mocks a mano en los tests para que no nos den falsos positivos.