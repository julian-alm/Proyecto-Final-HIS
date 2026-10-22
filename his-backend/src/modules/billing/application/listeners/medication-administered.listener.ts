import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { MedicationAdministeredEvent } from '../../../../shared/domain/events/medication-administered.event';
import { ChargeOrmEntity } from '../../infrastructure/persistance/charge.orm-entity';
import { PriceListOrmEntity } from '../../infrastructure/persistance/price-list.orm-entity';

@Injectable()
export class MedicationAdministeredListener {
  private readonly logger = new Logger(MedicationAdministeredListener.name);

  constructor(
    @InjectRepository(ChargeOrmEntity)
    private readonly chargeRepo: Repository<ChargeOrmEntity>,
    @InjectRepository(PriceListOrmEntity)
    private readonly priceListRepo: Repository<PriceListOrmEntity>,
  ) {}

  @OnEvent('medication.administered', { async: true })
  async handleMedicationAdministeredEvent(event: MedicationAdministeredEvent) {
    this.logger.log(`Evento asíncrono [${event.eventId}] recibido.`);
    
    // 1. Consultar el precio unitario del insumo en la lista de precios vigente
    const priceItem = await this.priceListRepo.findOne({ where: { itemName: event.medicationName } });
    const unitPrice = priceItem ? priceItem.unitPrice : 1000; // Valor por defecto si no está cargado
    
    const totalCost = unitPrice * event.quantity;
    const concept = `Insumos de Farmacia: ${event.medicationName}`;

    // 2. Generar el cargo automático
    const charge = this.chargeRepo.create({
      id: randomUUID(),
      patientId: event.patientId,
      baseCost: totalCost,
      patientAmount: totalCost, 
      thirdPartyAmount: 0,
      concept: concept,
      sourceEventId: event.eventId // Trazabilidad de auditoría asegurada
    });

    await this.chargeRepo.save(charge);
    this.logger.log(`Cargo generado exitosamente y vinculado al evento ${event.eventId}`);
  }
} 