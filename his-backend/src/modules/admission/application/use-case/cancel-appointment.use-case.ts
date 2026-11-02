import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IAppointmentRepository } from '../../domain/ports/appointment.repository.port';
import { DomainException } from '../../../../shared/domain/domain-exception';
import { AppointmentCancelledEvent } from '../../domain/events/appointment-cancelled.event';

export class CancelAppointmentCommand {
    constructor(public readonly appointmentId: string) {}
}

@Injectable()
export class CancelAppointmentUseCase {
    constructor(
        @Inject(IAppointmentRepository)
        private readonly appointmentRepository: IAppointmentRepository,
        private readonly eventEmitter: EventEmitter2
    ) {}

    async execute(command: CancelAppointmentCommand): Promise<void> {
        const appointment = await this.appointmentRepository.findById(command.appointmentId);

        if (!appointment) {
            throw new DomainException('Turno no encontrado.');
        }

        appointment.cancel();

        await this.appointmentRepository.save(appointment);

        this.eventEmitter.emit(
            'appointment.cancelled',
            new AppointmentCancelledEvent(appointment.id, appointment.doctorId, appointment.startTime)
        );
    }
}