import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ITriageRepository } from '../../domain/ports/triage.repository.port';
import { TriageEntry } from '../../domain/entities/triage-entry.entity';
import { TriageOrmEntity } from './triage.orm-entity';

@Injectable()
export class TypeOrmTriageRepository implements ITriageRepository {
    constructor(
        @InjectRepository(TriageOrmEntity)
        private readonly ormRepository: Repository<TriageOrmEntity>,
    ) {}

    async add(entry: TriageEntry): Promise<void> {
        const ormEntity = this.ormRepository.create({
            id: entry.id,
            patientId: entry.patientId,
            level: entry.level,
            symptoms: entry.symptoms,
            arrivalTime: entry.arrivalTime,
            status: entry.status
        });
        await this.ormRepository.save(ormEntity);
    }

    async getNextPatientToAttend(): Promise<TriageEntry | null> {
        // MAGIA DE METODOLOGÍAS II: Ordenamiento compuesto (Prioridad Cola)
        const ormEntity = await this.ormRepository.findOne({
            where: { status: 'EN_ESPERA' },
            order: {
            level: 'ASC',        // 1ro: Los rojos (1) antes que amarillos (2)
            arrivalTime: 'ASC'   // 2do: El que llegó primero dentro del mismo color
            }
        });

        if (!ormEntity) return null;

        return new TriageEntry(
            ormEntity.id,
            ormEntity.patientId,
            ormEntity.level,
            ormEntity.symptoms,
            ormEntity.arrivalTime,
            ormEntity.status
        );
    }
}