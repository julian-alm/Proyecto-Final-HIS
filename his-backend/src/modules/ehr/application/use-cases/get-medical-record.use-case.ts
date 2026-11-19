import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IMedicalRecordRepository } from '../../domain/interfaces/medical-record.repository';

@Injectable()
export class GetMedicalRecordUseCase {
  constructor(
    @Inject(IMedicalRecordRepository)
    private readonly medicalRecordRepository: IMedicalRecordRepository,
  ) {}

  async execute(patientId: string) {
    const record = await this.medicalRecordRepository.findByPatientId(patientId);
    
    if (!record) {
      throw new NotFoundException(`No se encontró historia clínica para el paciente con ID: ${patientId}`);
    }

    return record;
  }
}