import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppointmentCancelledEvent } from '../../domain/events/appointment-cancelled.event';

@Injectable()
export class PromoteStandbyListener {
    // El decorador @OnEvent conecta este método con el evento emitido
    @OnEvent('appointment.cancelled')
    async handleAppointmentCancelledEvent(event: AppointmentCancelledEvent) {
        console.log(`\n[EVENTO ASÍNCRONO DETECTADO]`);
        console.log(`-> El turno ${event.appointmentId} del Dr. ${event.doctorId} fue cancelado.`);
        console.log(`-> Buscando el primer paciente en la Lista de Espera (Standby) para esta fecha...`);

        // Aquí iría la lógica de buscar en tu BD al paciente en standby:
        // const standbyPatient = await this.standbyRepository.findFirst(event.doctorId, event.startTime);
        // if (standbyPatient) {
        //    console.log(`-> Asignando el turno liberado al paciente: ${standbyPatient.patientId}`);
        //    // Enviar email simulado, crear el nuevo turno, etc.
        // } else {
        //    console.log(`-> No hay pacientes en lista de espera para este bloque horario.`);
        // }

        console.log(`-> Proceso de promoción de Standby finalizado exitosamente.\n`);
    }
}