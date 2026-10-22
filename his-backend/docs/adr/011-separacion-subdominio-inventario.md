# ADR-008: Segregación del Subdominio de Inventario en un Módulo Independiente

* **Contexto:** En el documento de especificación de requerimientos, la gestión de camas (Épicas 1 y 2) y la gestión de inventario de insumos (Épica 3) se encontraban agrupadas bajo un mismo título general.
* **Decisión:** Segregar el sistema en dos módulos verticales independientes: `BedManagementModule` e `InventoryModule`.
* **Justificación (Metodologías II):** 
  * **Alta Cohesión y Principio de Responsabilidad Única (SRP):** El ciclo de vida de una cama (Patrón State: Libre, Ocupada, En Limpieza) responde a actores de Admisión y Maestranza, mientras que el control de stock de fármacos responde a operaciones aritméticas atómicas disparadas por Enfermería.
  * **Bajo Acoplamiento:** Ambos módulos evolucionan por razones diferentes y no comparten estado ni tablas en la base de datos.