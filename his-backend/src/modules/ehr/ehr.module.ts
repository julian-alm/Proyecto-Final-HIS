import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecordOrmEntity } from './infrastructure/persistence/medical-record.orm-entity';
import { EhrController } from './infrastructure/controllers/ehr.controller';
import { CreateMedicalRecordUseCase } from './application/use-cases/create-medical-record.use-case';
import { AddProgressNoteUseCase } from './application/use-cases/add-progress-note.use-case';
import { IMedicalRecordRepository } from './domain/interfaces/medical-record.repository';
import { IPatientRepository } from './domain/interfaces/patient.repository';
import { TypeOrmMedicalRecordRepository } from './infrastructure/persistence/typeorm-medical-record.repository';
import { TypeOrmPatientRepository } from './infrastructure/persistence/typeorm-patient.repository';
import { VitalSignsListener } from './application/listeners/vital-signs.listener';
import { GetMedicalRecordUseCase } from './application/use-cases/get-medical-record.use-case';
import { RegisterPatientUseCase } from './application/use-cases/register-patient.use-case';
import { PatientOrmEntity } from '../ehr/infrastructure/persistence/patient.orm-entity';

// 1. Importá tu módulo IAM
import { IamModule } from '../iam/iam.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([MedicalRecordOrmEntity, PatientOrmEntity,]),
    // 2. Agregalo acá para que el Guard pueda usar el JwtService
    IamModule, 
  ],
  controllers: [
    EhrController,
  ],
  providers: [
    CreateMedicalRecordUseCase,
    AddProgressNoteUseCase,
    GetMedicalRecordUseCase, // <-- Agregalo acá
    VitalSignsListener,
    RegisterPatientUseCase,
    {
      provide: IMedicalRecordRepository,
      useClass: TypeOrmMedicalRecordRepository,
    },
    { 
      provide: IPatientRepository, 
      useClass: TypeOrmPatientRepository 
    },
  ],
  exports: [IPatientRepository],
})
export class EhrModule {}
