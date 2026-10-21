import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IMedicalRecordRepository } from '../../domain/interfaces/medical-record.repository';
import { MedicalRecord } from '../../domain/entities/medical-record.entity';
import { MedicalRecordOrmEntity } from './medical-record.orm-entity';

@Injectable()
export class TypeOrmMedicalRecordRepository implements IMedicalRecordRepository {
  constructor(
    @InjectRepository(MedicalRecordOrmEntity)
    private readonly repository: Repository<MedicalRecordOrmEntity>,
  ) {}

  async save(record: MedicalRecord): Promise<void> {
    // Convertimos la Entidad de Dominio a la Entidad de Base de Datos
    const ormEntity = this.repository.create({
      id: record.id,
      patientId: record.patientId,
      bloodType: record.bloodType,
      allergies: record.allergies,
      chronicConditions: record.chronicConditions,
      progressNotes: record.progressNotes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    await this.repository.save(ormEntity);
  }

  async findByPatientId(patientId: string): Promise<MedicalRecord | null> {
    const ormEntity = await this.repository.findOne({ where: { patientId } });

    if (!ormEntity) {
      return null;
    }

    // Convertimos la Entidad de Base de Datos de vuelta a tu Entidad de Dominio
    return new MedicalRecord(
      ormEntity.id,
      ormEntity.patientId,
      ormEntity.bloodType,
      ormEntity.allergies,
      ormEntity.chronicConditions,
      ormEntity.progressNotes,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }
}