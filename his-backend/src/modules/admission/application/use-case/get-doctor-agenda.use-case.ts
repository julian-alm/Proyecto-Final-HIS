import { Injectable, Inject } from '@nestjs/common';
import { IAppointmentRepository } from '../../domain/ports/appointment.repository.port';
import { Appointment } from '../../domain/entities/appointment.entity';

@Injectable()
export class GetDoctorAgendaUseCase {
    constructor(
        @Inject(IAppointmentRepository)
        private readonly appointmentRepository: IAppointmentRepository
    ) {}

    async execute(doctorId: string): Promise<Appointment[]> {
        return this.appointmentRepository.findByDoctorId(doctorId);
    }
}