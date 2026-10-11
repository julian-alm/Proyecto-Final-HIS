export class MedicationAdministeredEvent {
  constructor(
    public readonly patientId: string,
    public readonly medicationName: string,
    public readonly quantity: number,
    public readonly timestamp: Date,
  ) {}
}
