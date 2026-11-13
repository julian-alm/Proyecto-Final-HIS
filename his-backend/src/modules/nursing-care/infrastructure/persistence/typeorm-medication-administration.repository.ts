import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IMedicationAdministrationRepository } from '../../domain/ports/medication-administration.repository.port';
import { MedicationAdministration } from '../../domain/entities/medication-administration.entity';
import { MedicationAdministrationOrmEntity } from './medication-administration.orm-entity';

@Injectable()
export class TypeOrmMedicationAdministrationRepository implements IMedicationAdministrationRepository {
  constructor(
    @InjectRepository(MedicationAdministrationOrmEntity)
    private readonly ormRepository: Repository<MedicationAdministrationOrmEntity>,
  ) {}

  async save(administration: MedicationAdministration): Promise<void> {
    const ormEntity = this.ormRepository.create({
      patientId: administration.patientId,
      nurseId: administration.nurseId,
      medicationName: administration.medicationName,
      dose: administration.dose,
      scheduledTime: administration.scheduledTime,
      administeredTime: administration.administeredTime,
      status: administration.status,
    });

    const savedEntity = await this.ormRepository.save(ormEntity);
    
    // Opcional: Reemplazamos el ID generado en memoria por el UUID real de Postgres
    (administration as any).id = savedEntity.id; 
  }
}