import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecordOrmEntity } from './infrastructure/persistence/medical-record.orm-entity';
import { EhrController } from './infrastructure/controllers/ehr.controller';
import { CreateMedicalRecordUseCase } from './application/use-cases/create-medical-record.use-case';
import { AddProgressNoteUseCase } from './application/use-cases/add-progress-note.use-case';
import { IMedicalRecordRepository } from './domain/interfaces/medical-record.repository';
import { TypeOrmMedicalRecordRepository } from './infrastructure/persistence/typeorm-medical-record.repository';
import { VitalSignsListener } from './application/listeners/vital-signs.listener';
import { GetMedicalRecordUseCase } from './application/use-cases/get-medical-record.use-case';

// 1. Importá tu módulo IAM
import { IamModule } from '../iam/iam.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([MedicalRecordOrmEntity]),
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
    {
      provide: IMedicalRecordRepository,
      useClass: TypeOrmMedicalRecordRepository,
    },
  ],
  exports: [],
})
export class EhrModule {}
