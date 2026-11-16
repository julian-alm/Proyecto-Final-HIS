import { Injectable, Inject } from '@nestjs/common';
import { IAppointmentRepository } from '../../domain/ports/appointment.repository.port';
import { Appointment } from '../../domain/entities/appointment.entity';
import { TypeOrmDoctorProfileRepository } from '../../../staff/infrastructure/persistence/typeorm-doctor-profile.repository';

@Injectable()
export class GetDoctorAgendaUseCase {
    constructor(
        @Inject(IAppointmentRepository)
        private readonly appointmentRepository: IAppointmentRepository,
        private readonly doctorProfileRepository: TypeOrmDoctorProfileRepository
    ) {}

    async execute(providedId: string): Promise<Appointment[]> {
        const doctorProfile = await this.doctorProfileRepository.findByUserId(providedId);

        const targetDoctorId = doctorProfile ? doctorProfile.id : providedId;

        return this.appointmentRepository.findByDoctorId(targetDoctorId);
    }
}