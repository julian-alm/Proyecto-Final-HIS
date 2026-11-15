import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingController } from './infrastructure/controllers/billing.controller';
import { CalculateConsultationCostUseCase } from './application/use-cases/calculate-consultation-cost.use-case';
import { ChargeOrmEntity } from './infrastructure/persistance/charge.orm-entity';
import { MedicationAdministeredListener } from './application/listeners/medication-administered.listener';

// IMPORTANTE: Importamos el módulo entero de IAM
import { IamModule } from '../iam/iam.module'; 
import { PriceListOrmEntity } from './infrastructure/persistance/price-list.orm-entity';
import { EhrModule } from '../ehr/ehr.module';
import { IChargeRepository } from './domain/ports/charge.repository.port';
import { TypeOrmChargeRepository } from './infrastructure/persistance/typeorm-charge.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChargeOrmEntity, PriceListOrmEntity]),
    IamModule,
    EhrModule
  ],
  controllers: [BillingController],
  providers: [
    CalculateConsultationCostUseCase,
    MedicationAdministeredListener,
    {
      provide: IChargeRepository,
      useClass: TypeOrmChargeRepository,
    }
  ],
})
export class BillingModule {}