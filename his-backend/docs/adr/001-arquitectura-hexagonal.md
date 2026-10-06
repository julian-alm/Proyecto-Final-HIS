# ADR-001: Adopción de Arquitectura Hexagonal, Inversión de Dependencias y Package by Component

* **Estado:** Aceptado
* **Fecha:** 06/10/2026

## Contexto y Problema
El sistema de información hospitalaria (HIS) posee reglas de negocio críticas (máquinas de estado de turnos, protocolos de ingreso de enfermería y estrategias de facturación). En una arquitectura tradicional en capas orientada a la base de datos, la lógica de negocio depende directamente del ORM (TypeORM) y del motor PostgreSQL, dificultando las pruebas unitarias aisladas y generando un alto acoplamiento.

## Decisión
1. **Organización Vertical (`Package by Component` y `Screaming Architecture`):** Dividimos el proyecto en módulos de dominio (`iam`, `admission`, `ehr`, `nursing-care`), alineados con la **Maniobra Inversa de Conway** para que los 3 integrantes trabajen en paralelo sin conflictos de código.
2. **Inversión de Dependencias (DIP):** Cada módulo separa estrictamente `domain` (entidades puras, patrones State/Builder y puertos abstractos), `application` (casos de uso) e `infrastructure` (adaptadores primarios HTTP y secundarios TypeORM/PostgreSQL).
3. **Mapeo Explícito:** Se separa la entidad de dominio pura de la entidad ORM (`*.orm-entity.ts`), conectando el puerto con el adaptador mediante el contenedor de Inyección de Dependencias de NestJS.

## Trade-offs (Compromisos Asumidos)
* **Ganancia:** El núcleo del negocio es 100% agnóstico a PostgreSQL y NestJS. Podemos ejecutar pruebas unitarias herméticas (TDD) en milisegundos sin levantar la base de datos.
* **Costo asumido:** Mayor esfuerzo inicial de escritura al tener que mantener clases separadas para el Dominio y para TypeORM junto con sus métodos de mapeo (`toDomain`).