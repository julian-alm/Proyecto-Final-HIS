import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BedStatusChangedEvent } from '../../domain/events/bed-status-changed.event';

@Injectable()
export class BedMonitorListener {
    @OnEvent('bed.status.changed')
    handleBedStatusChanged(event: BedStatusChangedEvent) {
        console.log(`\n[MONITOR MAPA DE CAMAS - TIEMPO REAL]`);
        console.log(`-> Habitación/Cama: ${event.roomNumber} (ID: ${event.bedId})`);
        console.log(`-> Nuevo Estado: [${event.newStatus}]`);
        console.log(`-> Actualizado a las: ${event.timestamp.toLocaleTimeString()}\n`);
    }
}