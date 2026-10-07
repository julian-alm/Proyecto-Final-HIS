import { Injectable, Inject } from '@nestjs/common';
import { IAppointmentRepository } from '../../domain/ports/appointment.repository.port';
import { DomainException } from '../../../../shared/domain/domain-exception';

export class BookAppointmentCommand {
    constructor(
        public readonly appointmentId: string,
        public readonly patientId: string,
    ) {}
    }

    @Injectable()
    export class BookAppointmentUseCase {
    constructor(
        @Inject(IAppointmentRepository)
        private readonly appointmentRepository: IAppointmentRepository,
    ) {}

    async execute(command: BookAppointmentCommand): Promise<void> {
        // 1. Recuperar la entidad de dominio
        const appointment = await this.appointmentRepository.findById(command.appointmentId);

        if (!appointment) {
        throw new DomainException('Turno no encontrado.');
        }

        // 2. Ejecutar regla de negocio (cambia estado internamente)
        appointment.book(command.patientId);

        // 3. Persistir. Si otro usuario guardó un milisegundo antes, el adaptador lanzará un error de concurrencia.
        await this.appointmentRepository.save(appointment);
    }
}