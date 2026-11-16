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

    async execute(userId: string): Promise<Appointment[]> {
        const doctorProfile = await this.doctorProfileRepository.findByUserId(userId);
        if (!doctorProfile) {
            return [];
        }
        return this.appointmentRepository.findByDoctorId(doctorProfile.id);
    }
}