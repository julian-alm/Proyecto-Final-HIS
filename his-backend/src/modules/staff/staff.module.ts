import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorProfileOrmEntity } from './infrastructure/persistence/doctor-profile.orm-entity';
import { TypeOrmDoctorProfileRepository } from './infrastructure/persistence/typeorm-doctor-profile.repository';
import { StaffController } from './infrastructure/controllers/staff.controller';
import { IamModule } from '../iam/iam.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([DoctorProfileOrmEntity]),
        IamModule // Para poder usar el RolesGuard
    ],
    controllers: [StaffController],
    providers: [TypeOrmDoctorProfileRepository],
    exports: [TypeOrmDoctorProfileRepository]
})
export class StaffModule {}