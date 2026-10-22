import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPatientRepository } from '../../domain/interfaces/patient.repository';
import { Patient } from '../../domain/entities/patient.entity';
import { CoverageType } from '../../domain/entities/coverage-type.enum';
import { PatientOrmEntity } from './patient.orm-entity';

@Injectable()
export class TypeOrmPatientRepository implements IPatientRepository {
    constructor(
        @InjectRepository(PatientOrmEntity)
        private readonly ormRepository: Repository<PatientOrmEntity>,
    ) {}

    async findById(id: string): Promise<Patient | null> {
        const orm = await this.ormRepository.findOne({ where: { id } });
        if (!orm) return null;
        return new Patient(orm.id, orm.dni, orm.firstName, orm.lastName, orm.coverageType as CoverageType);
    }

    async save(patient: Patient): Promise<void> {
        await this.ormRepository.save({
            id: patient.id,
            dni: patient.dni,
            firstName: patient.firstName,
            lastName: patient.lastName,
            coverageType: patient.coverageType
        });
    }
}