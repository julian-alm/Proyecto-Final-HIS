import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorProfileOrmEntity } from './infrastructure/persistence/doctor-profile.orm-entity';
// 👇 1. Importamos la nueva entidad de asignación
import { DoctorPatientAssignmentOrmEntity } from './infrastructure/persistence/doctor-patient-assignment.orm-entity';
import { TypeOrmDoctorProfileRepository } from './infrastructure/persistence/typeorm-doctor-profile.repository';
import { StaffController } from './infrastructure/controllers/staff.controller';
import { IamModule } from '../iam/iam.module';

@Module({
    imports: [
        // 👇 2. Agregamos la entidad al TypeOrmModule
        TypeOrmModule.forFeature([
            DoctorProfileOrmEntity,
            DoctorPatientAssignmentOrmEntity 
        ]),
        IamModule // Para poder usar el RolesGuard
    ],
    controllers: [StaffController],
    providers: [TypeOrmDoctorProfileRepository],
    exports: [TypeOrmDoctorProfileRepository]
})
export class StaffModule {}