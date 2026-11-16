# ADR 012: Consultas SQL Nativas con JOIN vs Relaciones del ORM

## Contexto
Cuando el frontend le pedía al backend la lista de médicos y pacientes asignados, usar las relaciones automáticas del ORM (TypeORM) hacía que la base de datos hiciera muchas consultas separadas por cada médico (el famoso Problema N+1). Además, esto le mandaba al frontend un JSON súper anidado y difícil de leer en Vue.

## Decisión
Decidimos usar el `EntityManager` en los controladores (como en `staff.controller.ts`) para saltearnos el ORM en las peticiones de lectura pesadas. Escribimos consultas SQL nativas usando `JOIN` para unir las tablas `doctor_profiles`, `doctor_patient_assignments` y `patients` a mano.

## Consecuencias
* **Positivas:** La consulta a PostgreSQL vuela porque se resuelve en un solo viaje. Al frontend le llega un JSON plano (con los datos limpios como `dni`, `firstName`, etc.), lo que hace que renderizar las tablas en Vue sea facilísimo.
* **Negativas:** Perdemos la protección del ORM al escribir. Si nos equivocamos en el nombre de una columna de SQL (como pasó con `doctorId`), el programa compila bien pero explota cuando hacemos la petición.