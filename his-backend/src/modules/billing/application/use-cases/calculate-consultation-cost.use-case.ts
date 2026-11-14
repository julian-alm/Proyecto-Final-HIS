import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BillingStrategyFactory, CoverageType } from '../../domain/factories/billing-strategy.factory';
import { IChargeRepository } from '../../domain/ports/charge.repository.port';

export interface CalculateCostCommand {
  patientId: string;
  coverageType: CoverageType;
  consultationBaseCost: number;
}

@Injectable()
export class CalculateConsultationCostUseCase {
  constructor(
    @Inject(IChargeRepository)
    private readonly chargeRepo: IChargeRepository,
  ) {}
  
  async execute(command: CalculateCostCommand) {
    const strategy = BillingStrategyFactory.getStrategy(command.coverageType);
    const result = strategy.calculateCharges(command.consultationBaseCost);

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