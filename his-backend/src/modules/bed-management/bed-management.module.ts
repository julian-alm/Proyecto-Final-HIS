import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BedOrmEntity } from './infrastructure/persistence/bed.orm-entity';
import { BedManagementController } from './infrastructure/controllers/bed-management.controller';
import { AssignBedUseCase } from './application/use-cases/assign-bed.use-case';
import { TypeOrmBedRepository } from './infrastructure/persistence/typeorm-bed.repository';
import { IBedRepository } from './domain/ports/bed.repository.port';
import { IamModule } from '../iam/iam.module'; 
import { DischargeBedUseCase } from './application/use-cases/discharge-bed.use-case';
import { CleanBedUseCase } from './application/use-cases/clean-bed.use-case';
import { BedMonitorListener } from './application/listeners/bed-monitor.listener';

@Module({
    imports: [
        TypeOrmModule.forFeature([BedOrmEntity]),
        IamModule
    ],
    controllers: [BedManagementController],
    providers: [
        AssignBedUseCase,
        DischargeBedUseCase,
        CleanBedUseCase,
        BedMonitorListener,
        {
            provide: IBedRepository,
            useClass: TypeOrmBedRepository,
        },
    ],
})
export class BedManagementModule {}