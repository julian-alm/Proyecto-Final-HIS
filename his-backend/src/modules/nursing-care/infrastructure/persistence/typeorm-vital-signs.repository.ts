import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IVitalSignsRepository } from '../../domain/ports/vital-signs.repository.port';
import { VitalSigns } from '../../domain/entities/vital-signs.entity';
import { VitalSignsOrmEntity } from './vital-signs.orm-entity';

@Injectable()
export class TypeOrmVitalSignsRepository implements IVitalSignsRepository {
  constructor(
    @InjectRepository(VitalSignsOrmEntity)
    private readonly ormRepository: Repository<VitalSignsOrmEntity>,
  ) {}

  async save(vitalSigns: VitalSigns): Promise<void> {
    // ... tu código actual del save ... (dejalo tal cual lo tenés)
  }

  // --- NUEVO MÉTODO PARA BUSCAR ---
  async findByPatientId(patientId: string): Promise<VitalSigns[]> {
    const ormEntities = await this.ormRepository.find({
      where: { patientId },
      order: { recordedAt: 'DESC' } // Ordenamos del más nuevo al más viejo
    });

    // Traducimos de la BD al Dominio
    return ormEntities.map(orm => new VitalSigns(
     orm.id,            // <-- Este es el que faltaba
      orm.patientId,
      orm.temperature,
      orm.bloodPressure,
      orm.heartRate
    ));
  }
}