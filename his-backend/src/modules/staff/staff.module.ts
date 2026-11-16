import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule, InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { DoctorProfileOrmEntity } from './infrastructure/persistence/doctor-profile.orm-entity';
import { DoctorPatientAssignmentOrmEntity } from './infrastructure/persistence/doctor-patient-assignment.orm-entity';
import { TypeOrmDoctorProfileRepository } from './infrastructure/persistence/typeorm-doctor-profile.repository';
import { StaffController } from './infrastructure/controllers/staff.controller';
import { IamModule } from '../iam/iam.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            DoctorProfileOrmEntity,
            DoctorPatientAssignmentOrmEntity 
        ]),
        IamModule
    ],
    controllers: [StaffController],
    providers: [TypeOrmDoctorProfileRepository],
    exports: [TypeOrmDoctorProfileRepository]
})
export class StaffModule implements OnModuleInit {
    constructor(@InjectEntityManager() private readonly entityManager: EntityManager) {}

    async onModuleInit() {
        try {
                await this.entityManager.query(`
                INSERT INTO doctor_profiles (id, "userId", specialty, "licenseNumber")
                SELECT gen_random_uuid(), id, 'Médico General', CONCAT('MP-', SUBSTRING(id::text, 1, 6))
                FROM users 
                WHERE role = 'DOCTOR' AND id NOT IN (SELECT "userId" FROM doctor_profiles)
            `);            console.log('✅ Base de datos sincronizada: Perfiles de médicos creados automáticamente.');
        } catch (error) {
        console.log('Nota: No se pudo auto-sincronizar los doctores:', (error as Error).message);         }
    }
}