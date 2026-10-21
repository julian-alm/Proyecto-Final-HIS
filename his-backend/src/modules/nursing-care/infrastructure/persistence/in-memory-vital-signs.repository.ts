import { Injectable } from '@nestjs/common';
import { IVitalSignsRepository } from '../../domain/ports/vital-signs.repository.port';
import { VitalSigns } from '../../domain/entities/vital-signs.entity';

@Injectable()
export class InMemoryVitalSignsRepository implements IVitalSignsRepository {
  private readonly database: VitalSigns[] = [];

  async save(vitalSigns: VitalSigns): Promise<void> {
    this.database.push(vitalSigns);
    console.log('✅ Signos vitales guardados en memoria:', vitalSigns);
  }

  async findByPatientId(patientId: string): Promise<VitalSigns[]> {
  return []; // Lo dejamos vacío porque es solo para que compile
}
}
