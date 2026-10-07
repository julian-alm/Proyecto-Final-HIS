import { Injectable, Inject } from '@nestjs/common';
import { IAppointmentRepository } from '../../domain/ports/appointment.repository.port';
import { DomainException } from '../../../../shared/domain/domain-exception';

export class CheckInAppointmentCommand {
    constructor(public readonly appointmentId: string) {}
}

@Injectable()
export class CheckInAppointmentUseCase {
    constructor(
        @Inject(IAppointmentRepository)
        private readonly appointmentRepository: IAppointmentRepository,
    ) {}

    async execute(command: CheckInAppointmentCommand): Promise<void> {
        const appointment = await this.appointmentRepository.findById(command.appointmentId);

    if (!appointment) {
        throw new DomainException('Turno no encontrado.');
    }

    // El objeto State valida si es posible. Si no, lanza la DomainException.
    appointment.checkInWaitingRoom();

    await this.appointmentRepository.save(appointment);
    }
}