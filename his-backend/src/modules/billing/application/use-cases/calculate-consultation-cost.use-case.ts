import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { BillingStrategyFactory, CoverageType } from '../../domain/factories/billing-strategy.factory';
import { ChargeOrmEntity } from '../../infrastructure/persistance/charge.orm-entity';

export interface CalculateCostCommand {
  patientId: string;
  coverageType: CoverageType;
  consultationBaseCost: number;
}

@Injectable()
export class CalculateConsultationCostUseCase {
  constructor(
    @InjectRepository(ChargeOrmEntity)
    private readonly chargeRepo: Repository<ChargeOrmEntity>,
  ) {}
  
  async execute(command: CalculateCostCommand) {
    const strategy = BillingStrategyFactory.getStrategy(command.coverageType);
    const result = strategy.calculateCharges(command.consultationBaseCost);

    // AHORA SÍ GUARDAMOS EN POSTGRESQL
    const charge = this.chargeRepo.create({
      id: randomUUID(),
      patientId: command.patientId,
      baseCost: command.consultationBaseCost,
      patientAmount: result.patientAmount,
      thirdPartyAmount: result.thirdPartyAmount,
      concept: 'Consulta Médica General'
    });

    await this.chargeRepo.save(charge);
    
    return {
      message: 'Cargo guardado exitosamente en la base de datos',
      chargeId: charge.id,
      ...result
    };
  }
}