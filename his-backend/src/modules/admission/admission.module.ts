import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentOrmEntity } from './infrastructure/persistence/appointment.orm-entity';
import { TriageOrmEntity } from './infrastructure/persistence/triage.orm-entity';
import { AdmissionController } from './infrastructure/controllers/admission.controller';
import { BookAppointmentUseCase } from './application/use-case/book-appointment.use-case';
import { AddTriageUseCase } from './application/use-case/add-triage.use-case';
import { GetNextTriageUseCase } from './application/use-case/get-next-triage.use-case';
import { TypeOrmAppointmentRepository } from './infrastructure/persistence/typeorm-appointment.repository';
import { IAppointmentRepository } from './domain/ports/appointment.repository.port';
import { TypeOrmTriageRepository } from './infrastructure/persistence/typeorm-triage.repository';
import { ITriageRepository } from './domain/ports/triage.repository.port';
import { CheckInAppointmentUseCase } from './application/use-case/check-in-appointment.use-case';
import { CancelAppointmentUseCase } from './application/use-case/cancel-appointment.use-case';
import { PromoteStandbyListener } from './application/listeners/promote-standby.listener';
import { InsertEntreturnoUseCase } from './application/use-case/insert-entreturno.use-case';
import { GetDoctorAgendaUseCase } from './application/use-case/get-doctor-agenda.use-case'
import { IamModule } from '../iam/iam.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([AppointmentOrmEntity, TriageOrmEntity]),
        IamModule
    ],
    controllers: [AdmissionController],
    providers: [
        BookAppointmentUseCase,
        CheckInAppointmentUseCase,
        AddTriageUseCase,
        GetNextTriageUseCase,
        GetDoctorAgendaUseCase,
        CancelAppointmentUseCase,
        PromoteStandbyListener,
        InsertEntreturnoUseCase,
        {
            provide: IAppointmentRepository,
            useClass: TypeOrmAppointmentRepository, // Inyección de Dependencias
        },
        { 
            provide: ITriageRepository, 
            useClass: TypeOrmTriageRepository 
        },
    ],
})
export class AdmissionModule {}