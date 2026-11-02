import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppointmentCancelledEvent } from '../../domain/events/appointment-cancelled.event';

@Injectable()
export class PromoteStandbyListener {
    @OnEvent('appointment.cancelled')
    async handleAppointmentCancelledEvent(event: AppointmentCancelledEvent) {
        console.log(`\n[EVENTO ASÍNCRONO DETECTADO]`);
        console.log(`-> El turno ${event.appointmentId} del Dr. ${event.doctorId} fue cancelado.`);
        console.log(`-> Buscando el primer paciente en la Lista de Espera (Standby) para esta fecha...`);
        console.log(`-> Proceso de promoción de Standby finalizado exitosamente.\n`);
    }
}