import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISupplyRepository } from '../../domain/ports/supply.repository.port';
import { MedicalSupply } from '../../domain/entities/medical-supply.entity';
import { SupplyOrmEntity } from './supply.orm-entity';
import { DomainException } from '../../../../shared/domain/domain-exception';

@Injectable()
export class TypeOrmSupplyRepository implements ISupplyRepository {
    constructor(
        @InjectRepository(SupplyOrmEntity)
        private readonly ormRepository: Repository<SupplyOrmEntity>,
    ) {}

    async findByName(name: string): Promise<MedicalSupply | null> {
        const orm = await this.ormRepository.findOne({ where: { name } });
        if (!orm) return null;
        return new MedicalSupply(orm.id, orm.name, orm.stock);
    }

    async save(supply: MedicalSupply): Promise<void> {
        await this.ormRepository.save({
            id: supply.id,
            name: supply.name,
            stock: supply.stock,
        });
    }

    async decrementStockAtomically(name: string, quantity: number): Promise<MedicalSupply> {
        const result = await this.ormRepository
            .createQueryBuilder()
            .update(SupplyOrmEntity)
            .set({ stock: () => `"stock" - ${Number(quantity)}` })
            .where('name = :name AND stock >= :quantity', { name, quantity })
            .returning(['id', 'name', 'stock'])
            .execute();

        if (!result.affected || result.affected === 0) {
            throw new DomainException(
                `No se pudo descontar stock de "${name}" (Insumo inexistente o stock insuficiente).`,
            );
        }

        const row = result.raw[0];
        return new MedicalSupply(row.id, row.name, row.stock);
    }
}