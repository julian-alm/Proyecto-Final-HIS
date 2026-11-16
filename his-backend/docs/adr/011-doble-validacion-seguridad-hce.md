# ADR 011: Doble Validación de Seguridad para la Historia Clínica (Front y Back)

## Contexto
La Historia Clínica Electrónica (HCE) es la parte más sensible del sistema. Si solo dejábamos la seguridad del lado del backend (NestJS), un usuario que manipulara la URL en Vue (ej: `/hce/99999999`) iba a ver la pantalla rota o vacía hasta que la API devolviera un error. Necesitábamos atajar esto en ambas capas.

## Decisión
Implementamos una validación en dos pasos. En el backend, el endpoint `/doctors/mis-pacientes` solo devuelve los pacientes estrictamente asignados al médico logueado. En el frontend, antes de cargar el componente de la HCE, interceptamos la navegación y usamos un `.some()` para verificar si el DNI de la URL está en esa lista que mandó el backend. Si no está, lo bloqueamos antes de que cargue la vista.

## Consecuencias
* **Positivas:** El sistema es mucho más seguro. Evitamos que se hagan peticiones innecesarias a la base de datos por DNIs que no corresponden.
* **Negativas:** Tenemos lógica de validación repetida (una en Vue y otra en NestJS), lo que nos obliga a mantener ambas sincronizadas.