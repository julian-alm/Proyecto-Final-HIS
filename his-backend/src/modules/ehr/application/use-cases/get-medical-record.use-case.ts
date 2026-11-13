import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IMedicalRecordRepository } from '../../domain/interfaces/medical-record.repository';
// ^ Ojo: Revisá que la ruta y el nombre de tu interfaz coincidan con los tuyos (puede ser .port.ts o similar)

@Injectable()
export class GetMedicalRecordUseCase {
  constructor(
    @Inject(IMedicalRecordRepository)
    private readonly medicalRecordRepository: IMedicalRecordRepository,
  ) {}

  async execute(patientId: string) {
    // Usamos el método de búsqueda que ya tenías (el mismo que usamos para evitar duplicados)
    const record = await this.medicalRecordRepository.findByPatientId(patientId);
    
    if (!record) {
      throw new NotFoundException(`No se encontró historia clínica para el paciente con ID: ${patientId}`);
    }

    return record;
  }
}