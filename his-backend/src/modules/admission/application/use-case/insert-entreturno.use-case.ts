import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { IAppointmentRepository } from '../../domain/ports/appointment.repository.port';
import { DomainException } from '../../../../shared/domain/domain-exception';
import { Appointment } from '../../domain/entities/appointment.entity';
import { BookedState } from '../../domain/states/appointment.state';
import { randomUUID } from 'crypto';

export class InsertEntreturnoCommand {
    constructor(
        public readonly doctorId: string,
        public readonly patientId: string,
        public readonly startTime: Date
    ) {}
}

@Injectable()
export class InsertEntreturnoUseCase {
    constructor(
        @Inject(IAppointmentRepository)
        private readonly appointmentRepository: IAppointmentRepository
    ) {}

    async execute(command: InsertEntreturnoCommand): Promise<void> {
        const previousAppointment = await this.appointmentRepository.findPrevious(
            command.doctorId, 
            command.startTime
        );

        if (!previousAppointment) {
            throw new DomainException('No se encontró un turno programado previo para acortar en este horario.');
        }

        const state = Reflect.get(previousAppointment, 'state') as { name?: string } | string;
        const currentState = typeof state === 'string' ? state : state.name ?? '';
        const invalidStates = ['EN_CONSULTORIO', 'ATENDIDO', 'CANCELADO'];
        
        if (invalidStates.includes(currentState as string)) {
            throw new ConflictException(`No se puede insertar un entreturno porque el turno original está en estado ${currentState}.`);
        }

        previousAppointment.endTime = command.startTime;

        const entreturnoEndTime = new Date(command.startTime.getTime() + 15 * 60000);
        
        const entreturno = new Appointment(
            randomUUID(),
            command.doctorId,
            command.startTime,
            entreturnoEndTime,
            command.patientId,
            new BookedState(),
            1,
            true
        );

        await this.appointmentRepository.save(previousAppointment);
        await this.appointmentRepository.save(entreturno);
    }
}