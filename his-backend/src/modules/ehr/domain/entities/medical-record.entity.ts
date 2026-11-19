export class MedicalRecord {
  constructor(
    public readonly id: string,
    public readonly patientId: string,
    public bloodType: string | null,
    public allergies: string[],
    public chronicConditions: string[],
    public progressNotes: { doctorId: string, note: string, date: Date }[],
    public readonly createdAt: Date,
    public updatedAt: Date,
    public careProtocols: any[] = [], 
  ) {}

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

  // Método de dominio para inyectarle un protocolo nuevo a la HCE
  public addCareProtocol(protocol: any): void {
    if (!this.careProtocols) {
      this.careProtocols = [];
    }
    this.careProtocols.push(protocol);
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
      [], 
      new Date(),
      new Date(),
      [], 
    );
  }
}