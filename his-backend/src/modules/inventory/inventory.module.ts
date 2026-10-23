import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalSupplyOrmEntity } from './infrastructure/persistence/supply.orm-entity';
import { InventoryController } from './infrastructure/controllers/inventory.controller';
import { DeductSupplyStockUseCase } from './application/use-cases/deduct-supply-stock.use-case';
import { SupplyStockListener } from './application/listeners/supply-stock.listener';
import { TypeOrmSupplyRepository } from './infrastructure/persistence/typeorm-supply.repository';
import { ISupplyRepository } from './domain/ports/supply.repository.port';
import { IamModule } from '../iam/iam.module';
import { SupplyMovementOrmEntity } from './infrastructure/persistence/supply-movement.orm-entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([MedicalSupplyOrmEntity, SupplyMovementOrmEntity]),
        IamModule,
    ],
    controllers: [InventoryController],
    providers: [
        DeductSupplyStockUseCase,
        SupplyStockListener,
        {
            provide: ISupplyRepository,
            useClass: TypeOrmSupplyRepository,
        },
    ],
})
export class InventoryModule {}