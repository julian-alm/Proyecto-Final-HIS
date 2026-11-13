import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBedRepository } from '../../domain/ports/bed.repository.port';
import { Bed } from '../../domain/entities/bed.entity';
import { BedOrmEntity } from './bed.orm-entity';
import { FreeState, OccupiedState, CleaningState, BlockedState } from '../../domain/states/bed.state';

@Injectable()
export class TypeOrmBedRepository implements IBedRepository {
    constructor(
        @InjectRepository(BedOrmEntity)
        private readonly ormRepository: Repository<BedOrmEntity>,
    ) {}

    async findById(id: string): Promise<Bed | null> {
        const ormEntity = await this.ormRepository.findOne({ where: { id } });
        if (!ormEntity) return null;

        // Mapeo inverso: String de BD -> Objeto State de Dominio
        let state;
        switch (ormEntity.status) {
            case 'OCUPADAS': state = new OccupiedState(); break;
            case 'EN_LIMPIEZA': state = new CleaningState(); break;
            case 'BLOQUEADAS': state = new BlockedState(); break;
            default: state = new FreeState();
        }

        return new Bed(
            ormEntity.id,
            ormEntity.roomNumber,
            ormEntity.patientId,
            state,
            ormEntity.version
        );
    }

    async save(bed: Bed): Promise<void> {
        const ormEntity = this.ormRepository.create({
            id: bed.id,
            roomNumber: bed.roomNumber,
            patientId: bed.patientId ?? undefined,
            status: bed.statusName,
            version: bed.version
        });

        try {
                await this.ormRepository.save(ormEntity);
            } catch (error) {
                // Capturamos la excepción de concurrencia de TypeORM
                if (error instanceof Error && error.name === 'OptimisticLockVersionMismatchError') {
                    throw new Error('Conflicto de concurrencia: La cama acaba de ser modificada por otro usuario.');
                }
                throw error;
            }
    }
}