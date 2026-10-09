export class VitalSigns {
  constructor(
    public readonly id: string,
    public readonly patientId: string,
    public readonly temperature: number,
    public readonly bloodPressure: string,
    public readonly recordedAt: Date = new Date()
  ) {
    if (temperature < 34 || temperature > 42) {
      throw new Error('Temperatura registrada fuera de rangos humanos posibles.');
    }
  }

  hasHighFever(): boolean {
    return this.temperature > 39.0;
  }
}