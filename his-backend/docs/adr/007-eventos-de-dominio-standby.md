# ADR-007: Uso de Eventos de Dominio para procesos asíncronos (Lista de Espera)

* **Contexto:** Cuando un paciente cancela su turno (HU 1.3), el sistema debe buscar si hay pacientes en la Lista de Espera (Standby) para ese mismo bloque horario y promoverlos automáticamente.
* **Decisión:** Implementar Arquitectura Orientada a Eventos (EDA) utilizando `@nestjs/event-emitter`. El caso de uso `CancelAppointmentUseCase` se limita a cancelar el turno y emitir el evento de dominio `appointment.cancelled`. Un listener independiente (`PromoteStandbyListener`) escucha este evento y ejecuta la lógica de promoción en segundo plano.
* **Consecuencias (Trade-offs):**
    * *Positivo:* Desacoplamiento total. El módulo de reservas no necesita conocer las reglas de negocio de la lista de espera, respetando el Principio de Responsabilidad Única (SRP).
    * *Positivo:* Mejora el tiempo de respuesta HTTP, ya que el usuario no espera a que el sistema busque en la lista de espera para recibir su confirmación de cancelación.
    * *Negativo:* La trazabilidad del código es ligeramente más compleja, ya que el flujo de ejecución no es lineal.