import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingController } from './infrastructure/controllers/billing.controller';
import { CalculateConsultationCostUseCase } from './application/use-cases/calculate-consultation-cost.use-case';
import { ChargeOrmEntity } from './infrastructure/persistance/charge.orm-entity';
import { MedicationAdministeredListener } from './application/listeners/medication-administered.listener';

// IMPORTANTE: Importamos el módulo entero de IAM
import { IamModule } from '../iam/iam.module'; 
import { PriceListOrmEntity } from './infrastructure/persistance/price-list.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChargeOrmEntity, PriceListOrmEntity]), // 1. Conectamos la tabla de base de datos
    IamModule // 2. Importamos IAM para que el controlador pueda usar @UseGuards(RolesGuard)
  ],
  controllers: [BillingController],
  providers: [
    CalculateConsultationCostUseCase,
    MedicationAdministeredListener // 3. Registramos el escuchador de eventos asíncronos
    // Ya NO ponemos RolesGuard acá, porque viene inyectado a través del IamModule
  ],
})
export class BillingModule {}