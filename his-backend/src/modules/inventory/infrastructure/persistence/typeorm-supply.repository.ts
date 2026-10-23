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
        const orm = await this.ormRepository.findOne({ where: { name } });
        if (!orm) return null;

        // Calculamos el stock actual al vuelo consultando el libro mayor de movimientos
        const currentStock = await this.calculateStockForName(name);

        return new MedicalSupply(orm.id, orm.name, currentStock, orm.description);
    }

    async save(supply: MedicalSupply): Promise<void> {
        // Guardamos el insumo en el catálogo
        await this.ormRepository.save({
            id: supply.id,
            name: supply.name,
            description: supply.description,
        });

        // Si la entidad viene con stock inicial, registramos un movimiento de INGRESO inicial
        if (supply.stock && supply.stock > 0) {
            await this.movementRepo.save({
                id: randomUUID(),
                medicationName: supply.name,
                quantity: supply.stock,
                type: MovementType.INGRESO,
                reason: 'Stock inicial de registro',
            });
        }
    }

    async decrementStockAtomically(name: string, quantity: number): Promise<MedicalSupply> {
        // 1. Verificamos que el insumo exista en el catálogo
        const supplyOrm = await this.ormRepository.findOne({ where: { name } });
        if (!supplyOrm) {
            throw new DomainException(`El insumo "${name}" no existe en el catálogo.`);
        }

        // 2. Calculamos el stock actual en tiempo real mediante el libro de movimientos
        const currentStock = await this.calculateStockForName(name);

        if (currentStock < quantity) {
            throw new DomainException(
                `No se pudo descontar stock de "${name}" (Stock insuficiente: disponible ${currentStock}, requerido ${quantity}).`,
            );
        }

        // 3. Registramos el EGRESO en el libro de movimientos (Garantiza auditoría e inmutabilidad)
        await this.movementRepo.save({
            id: randomUUID(),
            medicationName: name,
            quantity: Number(quantity),
            type: MovementType.EGRESO,
            reason: 'Administración de medicación a paciente',
        });

        // 4. Retornamos la entidad actualizada con el nuevo stock calculado
        const updatedStock = currentStock - Number(quantity);
        return new MedicalSupply(supplyOrm.id, supplyOrm.name, updatedStock, supplyOrm.description);
    }

    // Método auxiliar privado para calcular el stock sumando ingresos y restando egresos
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
}