import { Injectable, Inject } from '@nestjs/common';
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

        // HU 1.2: Ajustar dinámicamente la duración del turno previo
        previousAppointment.endTime = command.startTime;

        // Crear el entreturno (asumiendo 15 minutos de duración para la urgencia menor)
        const entreturnoEndTime = new Date(command.startTime.getTime() + 15 * 60000);
        
        const entreturno = new Appointment(
            randomUUID(),
            command.doctorId,
            command.startTime,
            entreturnoEndTime,
            command.patientId,
            new BookedState(), // Ingresa directamente como RESERVADO
            1,
            true // isOverbooking = true (Etiqueta visual)
        );

        // Persistir ambos cambios en la base de datos
        await this.appointmentRepository.save(previousAppointment);
        await this.appointmentRepository.save(entreturno);
    }
}