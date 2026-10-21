import { Injectable, Inject } from '@nestjs/common';
import { MedicalRecord } from '../../domain/entities/medical-record.entity';
import { IMedicalRecordRepository } from '../../domain/interfaces/medical-record.repository';

@Injectable()
export class CreateMedicalRecordUseCase {
  constructor(
    @Inject(IMedicalRecordRepository)
    private readonly medicalRecordRepository: IMedicalRecordRepository,
  ) {}

  async execute(patientId: string): Promise<MedicalRecord> {
    // 1. Verificamos si este paciente ya tiene una historia clínica
    const existingRecord = await this.medicalRecordRepository.findByPatientId(patientId);
    
    if (existingRecord) {
      // Si ya tiene, no creamos una nueva, devolvemos un error (o podríamos simplemente devolver la existente)
      throw new Error(`El paciente ${patientId} ya tiene una historia clínica activa.`);
    }

    // 2. Usamos el método de tu Entidad para fabricar una nueva (sin alergias ni notas todavía)
    const newRecord = MedicalRecord.create(patientId);

    // 3. La guardamos
    await this.medicalRecordRepository.save(newRecord);

    return newRecord;
  }
}