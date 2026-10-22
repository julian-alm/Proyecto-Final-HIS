import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { MedicationAdministeredEvent } from '../../../../shared/domain/events/medication-administered.event';
import { ChargeOrmEntity } from '../../infrastructure/persistance/charge.orm-entity';
import { PriceListOrmEntity } from '../../infrastructure/persistance/price-list.orm-entity';

// 1. Importamos el Puerto de Pacientes (EHR) y la Factory de Estrategias (Billing)
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
    // 2. Inyectamos el repositorio de pacientes y la fábrica de estrategias
    @Inject(IPatientRepository)
    private readonly patientRepository: IPatientRepository,
  ) {}

  @OnEvent('medication.administered', { async: true })
  async handleMedicationAdministeredEvent(event: MedicationAdministeredEvent) {
    this.logger.log(`Evento asíncrono [${event.eventId}] recibido.`);

    // 1. Consultar el precio unitario del insumo en la lista de precios vigente
    const priceItem = await this.priceListRepo.findOne({
      where: { itemName: event.medicationName },
    });
    const unitPrice = priceItem ? Number(priceItem.unitPrice) : 1000;

    const totalCost = unitPrice * Number(event.quantity || 1);
    const concept = `Insumos de Farmacia: ${event.medicationName}`;

    // 2. Buscar al paciente para obtener su tipo de cobertura real
    let patient = null;
    try {
      patient = await this.patientRepository.findById(event.patientId);
    } catch {
      // Si envían un ID de prueba que no es UUID válido (ej. "paciente-ana-rojas"), usamos el fallback sin romper PostgreSQL
      this.logger.warn(
        `El patientId "${event.patientId}" no es un UUID registrado. Usando cobertura PARTICULAR por defecto.`,
      );
    }

    const coverageType = patient ? patient.coverageType : 'PARTICULAR';

    // 3. Obtener y ejecutar el Patrón Strategy según la cobertura del paciente
    const strategy = BillingStrategyFactory.getStrategy(coverageType as any);
    const calculation: any = (
      strategy as unknown as { calculate: (amount: number) => any }
    ).calculate(totalCost);

    // Soportamos los nombres de propiedades que haya definido el Integrante 3 en el retorno de su Strategy
    const patientAmount =
      calculation.patientAmount ??
      calculation.patientCost ??
      calculation.copay ??
      totalCost;

    const thirdPartyAmount =
      calculation.thirdPartyAmount ??
      calculation.thirdPartyCost ??
      calculation.coveredAmount ??
      totalCost - patientAmount;

    // 4. Generar el cargo automático con el desglose calculado por la estrategia
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