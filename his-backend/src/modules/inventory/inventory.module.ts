import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplyOrmEntity } from './infrastructure/persistence/supply.orm-entity';
import { InventoryController } from './infrastructure/controllers/inventory.controller';
import { DeductSupplyStockUseCase } from './application/use-cases/deduct-supply-stock.use-case';
import { SupplyStockListener } from './application/listeners/supply-stock.listener';
import { TypeOrmSupplyRepository } from './infrastructure/persistence/typeorm-supply.repository';
import { ISupplyRepository } from './domain/ports/supply.repository.port';
import { IamModule } from '../iam/iam.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([SupplyOrmEntity]),
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