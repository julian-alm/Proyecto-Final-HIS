import { randomUUID } from 'crypto';

export class MedicationAdministeredEvent {
  public readonly eventId: string; // ID único para trazabilidad de auditoría

  constructor(
    public readonly patientId: string,
    public readonly medicationName: string,
    public readonly quantity: number,
    public readonly timestamp: Date = new Date(),
  ) {
    this.eventId = randomUUID(); // Se genera automáticamente cuando se emite
  }
}