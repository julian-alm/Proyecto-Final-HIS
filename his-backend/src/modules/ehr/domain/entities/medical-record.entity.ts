export class MedicalRecord {
  constructor(
    public readonly id: string,
    public readonly patientId: string,
    public bloodType: string | null,
    public allergies: string[],
    public chronicConditions: string[],
    // Acá se van a guardar las notas/evoluciones que escriben los médicos
    public progressNotes: { doctorId: string, note: string, date: Date }[],
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  // --- COMPORTAMIENTOS DEL DOMINIO ---

  public addAllergy(allergy: string): void {
    if (!this.allergies.includes(allergy)) {
      this.allergies.push(allergy);
      this.updatedAt = new Date();
    }
  }

  public addChronicCondition(condition: string): void {
    if (!this.chronicConditions.includes(condition)) {
      this.chronicConditions.push(condition);
      this.updatedAt = new Date();
    }
  }

  public addProgressNote(doctorId: string, note: string): void {
    this.progressNotes.push({ doctorId, note, date: new Date() });
    this.updatedAt = new Date();
  }

  // Método para crear una Historia Clínica en blanco (cuando entra un paciente nuevo)
  public static create(patientId: string): MedicalRecord {
    return new MedicalRecord(
      crypto.randomUUID(), // Genera un ID único automáticamente
      patientId,
      null, 
      [],   
      [],   
      [], // Arranca sin notas médicas
      new Date(),
      new Date(),
    );
  }
}