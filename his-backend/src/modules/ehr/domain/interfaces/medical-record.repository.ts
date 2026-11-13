import { MedicalRecord } from '../entities/medical-record.entity';

export interface IMedicalRecordRepository {
  // Guardar o actualizar la historia clínica
  save(record: MedicalRecord): Promise<void>;
  
  // Buscar la historia clínica de un paciente específico
  findByPatientId(patientId: string): Promise<MedicalRecord | null>;
}

// Exportamos este Symbol para poder inyectarlo después en los casos de uso (cosas de NestJS)
export const IMedicalRecordRepository = Symbol('IMedicalRecordRepository');