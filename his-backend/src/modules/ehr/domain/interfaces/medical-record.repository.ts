import { MedicalRecord } from '../entities/medical-record.entity';

export interface IMedicalRecordRepository {
  // Guardar o actualizar la historia clínica
  save(record: MedicalRecord): Promise<void>;
  // Buscar la historia clínica de un paciente específico
  findByPatientId(patientId: string): Promise<MedicalRecord | null>;
}

export const IMedicalRecordRepository = Symbol('IMedicalRecordRepository');