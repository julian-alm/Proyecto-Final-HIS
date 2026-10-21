import { Injectable, Inject } from '@nestjs/common';
import { IMedicalRecordRepository } from '../../domain/interfaces/medical-record.repository';

// Este DTO (Data Transfer Object) define qué datos necesitamos para esta acción
export interface AddProgressNoteDto {
  patientId: string;
  doctorId: string;
  note: string;
}

@Injectable()
export class AddProgressNoteUseCase {
  constructor(
    // Inyectamos la interfaz que acabás de crear (el Puerto)
    @Inject(IMedicalRecordRepository)
    private readonly medicalRecordRepository: IMedicalRecordRepository,
  ) {}

  async execute(data: AddProgressNoteDto): Promise<void> {
    // 1. Buscamos la historia clínica del paciente
    const record = await this.medicalRecordRepository.findByPatientId(data.patientId);
    
    if (!record) {
      throw new Error(`No se encontró la historia clínica del paciente ${data.patientId}.`);
    }

    // 2. Agregamos la evolución médica usando la regla de negocio de tu Entidad
    record.addProgressNote(data.doctorId, data.note);

    // 3. Guardamos los cambios
    await this.medicalRecordRepository.save(record);
  }
}