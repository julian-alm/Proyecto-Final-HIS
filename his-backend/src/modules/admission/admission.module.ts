import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentOrmEntity } from './infrastructure/persistence/appointment.orm-entity';
import { AdmissionController } from './infrastructure/controllers/admission.controller';
import { BookAppointmentUseCase } from './application/use-case/book-appointment.use-case';
import { TypeOrmAppointmentRepository } from './infrastructure/persistence/typeorm-appointment.repository';
import { IAppointmentRepository } from './domain/ports/appointment.repository.port';
import { CheckInAppointmentUseCase } from './application/use-case/check-in-appointment.use-case';
import { IamModule } from '../iam/iam.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([AppointmentOrmEntity]),
        IamModule
    ],
    controllers: [AdmissionController],
    providers: [
        BookAppointmentUseCase,
        CheckInAppointmentUseCase,
        {
            provide: IAppointmentRepository,
            useClass: TypeOrmAppointmentRepository, // Inyección de Dependencias
        },
    ],
})
export class AdmissionModule {}