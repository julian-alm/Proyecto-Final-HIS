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
    // 👇 1. Agregamos el arreglo donde se van a guardar los protocolos generados
    public careProtocols: any[] = [], 
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

  // 👇 2. Método de dominio para inyectarle un protocolo nuevo a la HCE
  public addCareProtocol(protocol: any): void {
    if (!this.careProtocols) {
      this.careProtocols = [];
    }
    this.careProtocols.push(protocol);
    this.updatedAt = new Date(); // Actualizamos la fecha de modificación
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
      [], // 👇 3. Inicializamos los protocolos vacíos al crear la HCE
    );
  }
}