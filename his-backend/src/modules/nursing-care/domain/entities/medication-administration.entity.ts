export class MedicationAdministration {
  constructor(
    public readonly id: string,
    public readonly patientId: string,
    public readonly nurseId: string,
    public readonly medicationName: string,
    public readonly dose: string,
    public readonly scheduledTime: Date,
    public readonly administeredTime: Date,
    public status: 'ADMINISTRADA' | 'FUERA_DE_TERMINO' = 'ADMINISTRADA'
  ) {
    this.validateTimeMargin();
  }

  // Regla de Negocio Core (HU 1.2): Validar margen de +/- 30 minutos
  private validateTimeMargin(): void {
    const diffInMilliseconds = Math.abs(this.administeredTime.getTime() - this.scheduledTime.getTime());
    const diffInMinutes = diffInMilliseconds / (1000 * 60);

    if (diffInMinutes > 30) {
      this.status = 'FUERA_DE_TERMINO';
    }
  }

  // Método para saber si se aplicó a tiempo
  isOnTime(): boolean {
    return this.status === 'ADMINISTRADA';
  }
}