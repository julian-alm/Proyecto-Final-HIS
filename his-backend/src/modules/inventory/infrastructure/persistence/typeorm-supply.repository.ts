import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISupplyRepository } from '../../domain/ports/supply.repository.port';
import { MedicalSupply } from '../../domain/entities/medical-supply.entity';
import { MedicalSupplyOrmEntity } from './supply.orm-entity';
import { SupplyMovementOrmEntity, MovementType } from './supply-movement.orm-entity';
import { DomainException } from '../../../../shared/domain/domain-exception';
import { randomUUID } from 'crypto';

@Injectable()
export class TypeOrmSupplyRepository implements ISupplyRepository {
    constructor(
        @InjectRepository(MedicalSupplyOrmEntity)
        private readonly ormRepository: Repository<MedicalSupplyOrmEntity>,
        @InjectRepository(SupplyMovementOrmEntity)
        private readonly movementRepo: Repository<SupplyMovementOrmEntity>,
    ) {}

    async findByName(name: string): Promise<MedicalSupply | null> {
        // Búsqueda insensible a mayúsculas/minúsculas y espacios
        const orm = await this.ormRepository.createQueryBuilder('supply')
            .where('LOWER(TRIM(supply.name)) = LOWER(TRIM(:name))', { name })
            .getOne();
            
        if (!orm) return null;

        const currentStock = await this.calculateStockForName(name);
        return new MedicalSupply(orm.id, orm.name, currentStock, orm.description);
    }

async save(supply: MedicalSupply, reason?: string): Promise<void> {
        await this.ormRepository.save({
            id: supply.id,
            name: supply.name,
            description: supply.description,
        });

        if (supply.stock && supply.stock > 0) {
            await this.movementRepo.save({
                id: randomUUID(),
                medicationName: supply.name,
                quantity: supply.stock,
                type: MovementType.INGRESO,
                reason: reason || 'Stock inicial de registro', 
            });
        }
    }


async decrementStockAtomically(name: string, quantity: number, reason?: string): Promise<MedicalSupply> {
        const supplyOrm = await this.ormRepository.createQueryBuilder('supply')
            .where('LOWER(TRIM(supply.name)) = LOWER(TRIM(:name))', { name })
            .getOne();
            
        if (!supplyOrm) {
            throw new DomainException(`El insumo "${name}" no existe en el catálogo.`);
        }

        const currentStock = await this.calculateStockForName(name);

        if (currentStock < quantity) {
            throw new DomainException(
                `No se pudo descontar stock de "${name}" (Stock insuficiente: disponible ${currentStock}, requerido ${quantity}).`,
            );
        }

        await this.movementRepo.save({
            id: randomUUID(),
            medicationName: supplyOrm.name,
            quantity: Number(quantity),
            type: MovementType.EGRESO,
            reason: reason || 'Administración de medicación a paciente',
        });

        const updatedStock = currentStock - Number(quantity);
        return new MedicalSupply(supplyOrm.id, supplyOrm.name, updatedStock, supplyOrm.description);
    }


    private async calculateStockForName(name: string): Promise<number> {
        const result = await this.movementRepo
            .createQueryBuilder('movement')
            .select(
                "SUM(CASE WHEN movement.type = 'INGRESO' THEN movement.quantity ELSE -movement.quantity END)",
                'totalStock',
            )
            .where('LOWER(TRIM(movement.medicationName)) = LOWER(TRIM(:name))', { name })
            .getRawOne();

        return result && result.totalStock ? parseInt(result.totalStock, 10) : 0;
    }

    async getMovementHistory(): Promise<SupplyMovementOrmEntity[]> {
        return await this.movementRepo.find({
            order: { createdAt: 'DESC' },
            take: 100
        });
    }

    async getCurrentStock(): Promise<{ medicationName: string; currentStock: number }[]> {
        const results = await this.movementRepo
            .createQueryBuilder('movement')
            .select('movement.medicationName', 'medicationName')
            .addSelect("SUM(CASE WHEN movement.type = 'INGRESO' THEN movement.quantity ELSE -movement.quantity END)", 'currentStock')
            .groupBy('movement.medicationName')
            .orderBy('movement.medicationName', 'ASC')
            .getRawMany();

        return results.map(row => ({
            medicationName: row.medicationName,
            currentStock: parseInt(row.currentStock, 10) || 0
        }));
    }
}