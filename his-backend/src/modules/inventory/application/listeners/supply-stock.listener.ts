import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MedicationAdministeredEvent } from '../../../../shared/domain/events/medication-administered.event';
import { DeductSupplyStockUseCase, DeductSupplyStockCommand } from '../use-cases/deduct-supply-stock.use-case';

@Injectable()
export class SupplyStockListener {
    constructor(private readonly deductSupplyStockUseCase: DeductSupplyStockUseCase) {}

    @OnEvent('medication.administered', { async: true })
    async handleMedicationAdministered(event: MedicationAdministeredEvent) {
        console.log(`\n[INVENTARIO - HU 3.1] Evento recibido:`, event);
        
        const supplyName = event.medicationName;
        const quantity = Number(event.quantity || 1);
        
        try {
            const updated = await this.deductSupplyStockUseCase.execute(
                new DeductSupplyStockCommand(supplyName, quantity),
            );
            
            console.log(
                `-> [STOCK DESCONTADO]: Quedan ${updated.stock} unidades de "${updated.name}".\n`,
            );
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`-> [ALERTA DE STOCK]: ${message}\n`);
        }
    }
}