import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { MedicationAdministeredEvent } from '../../../../shared/domain/events/medication-administered.event';
import { ChargeOrmEntity } from '../../infrastructure/persistance/charge.orm-entity';
import { PriceListOrmEntity } from '../../infrastructure/persistance/price-list.orm-entity';
import { IPatientRepository } from '../../../ehr/domain/interfaces/patient.repository';
import { BillingStrategyFactory } from '../../domain/factories/billing-strategy.factory';

@Injectable()
export class MedicationAdministeredListener {
  private readonly logger = new Logger(MedicationAdministeredListener.name);

  constructor(
    @InjectRepository(ChargeOrmEntity)
    private readonly chargeRepo: Repository<ChargeOrmEntity>,
    @InjectRepository(PriceListOrmEntity)
    private readonly priceListRepo: Repository<PriceListOrmEntity>,
    @Inject(IPatientRepository)
    private readonly patientRepository: IPatientRepository,
  ) {}

  @OnEvent('medication.administered', { async: true })
  async handleMedicationAdministeredEvent(event: MedicationAdministeredEvent) {
    this.logger.log(`Evento asíncrono [${event.eventId}] recibido.`);

    const priceItem = await this.priceListRepo.findOne({
      where: { itemName: event.medicationName },
    });
    const unitPrice = priceItem ? Number(priceItem.unitPrice) : 1000;

    const totalCost = unitPrice * Number(event.quantity || 1);
    const concept = `Insumos de Farmacia: ${event.medicationName}`;

    let patient = null;
    try {
      patient = await this.patientRepository.findById(event.patientId);
    } catch {
      this.logger.warn(
        `El patientId "${event.patientId}" no es un UUID registrado. Usando cobertura PRIVATE por defecto.`,
      );
    }

    const coverageType = patient ? patient.coverageType : 'PRIVATE';

    const strategy = BillingStrategyFactory.getStrategy(coverageType as any);
    const calculation = strategy.calculateCharges(totalCost);

    const patientAmount =
      calculation.patientAmount ??
      totalCost;

    const thirdPartyAmount =
      calculation.thirdPartyAmount ??
      totalCost - patientAmount;
      
    const charge = this.chargeRepo.create({
      id: randomUUID(),
      patientId: event.patientId,
      baseCost: totalCost,
      patientAmount: patientAmount,
      thirdPartyAmount: thirdPartyAmount,
      concept: concept,
      sourceEventId: event.eventId,
    });

    await this.chargeRepo.save(charge);
    this.logger.log(
      `Cargo generado con estrategia [${coverageType}] (Paciente: $${patientAmount} | Tercero: $${thirdPartyAmount}) - Evento: ${event.eventId}`,
    );
  }
}