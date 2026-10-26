import { Injectable, Inject } from '@nestjs/common';
import { IAppointmentRepository } from '../../domain/ports/appointment.repository.port';
import { Appointment } from '../../domain/entities/appointment.entity';
import { BookedState } from '../../domain/states/appointment.state';
import { DomainException } from '../../../../shared/domain/domain-exception';
import { randomUUID } from 'crypto';

export class BookAppointmentCommand {
    constructor(
        public readonly doctorId: string,
        public readonly patientId: string,
        public readonly startTime: Date
    ) {}
}

@Injectable()
export class BookAppointmentUseCase {
    constructor(
        @Inject(IAppointmentRepository)
        private readonly appointmentRepository: IAppointmentRepository
    ) {}

    async execute(command: BookAppointmentCommand): Promise<void> {
        // Duración estándar de 30 minutos
        const endTime = new Date(command.startTime.getTime() + 30 * 60000);

        // VALIDACIÓN: Verificar si hay superposición
        const isOccupied = await this.appointmentRepository.hasTimeConflict(
            command.doctorId, 
            command.startTime, 
            endTime
        );

        if (isOccupied) {
            throw new DomainException('El profesional ya tiene un turno asignado en ese rango horario.');
        }

        const appointment = new Appointment(
            randomUUID(),
            command.doctorId,
            command.startTime,
            endTime,
            command.patientId,
            new BookedState(), 
            1,
            false
        );

        await this.appointmentRepository.save(appointment);
    }
}