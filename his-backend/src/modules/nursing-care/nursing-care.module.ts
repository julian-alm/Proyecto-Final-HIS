import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; 
import { GetVitalSignsHistoryUseCase } from './application/use-cases/get-vital-signs-history.use-case';
import { NursingCareController } from './infrastructure/controllers/nursing-care.controller';
import { RecordVitalSignsUseCase } from './application/use-cases/record-vital-signs.use-case';
import { GenerateCareProtocolUseCase } from './application/use-cases/generate-care-protocol.use-case';
import { IVitalSignsRepository } from './domain/ports/vital-signs.repository.port';
import { TypeOrmVitalSignsRepository } from './infrastructure/persistence/typeorm-vital-signs.repository';
import { VitalSignsOrmEntity } from './infrastructure/persistence/vital-signs.orm-entity'; 
import { AdministerMedicationUseCase } from './application/use-cases/administer-medication.use-case';
import { MedicationAdministrationOrmEntity } from './infrastructure/persistence/medication-administration.orm-entity';
import { VitalSignsListener } from './application/listeners/vital-signs.listener';
import { IMedicationAdministrationRepository } from './domain/ports/medication-administration.repository.port';
import { TypeOrmMedicationAdministrationRepository } from './infrastructure/persistence/typeorm-medication-administration.repository';
import { IamModule } from '../iam/iam.module';

// 👇 ACÁ ESTÁ EL CAMBIO: Importamos el EhrModule (verificá que la ruta sea correcta)
import { EhrModule } from '../ehr/ehr.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VitalSignsOrmEntity,
      MedicationAdministrationOrmEntity,
    ]),
    IamModule,
    EhrModule, // 👇 ACÁ ESTÁ EL CAMBIO: Lo agregamos al arreglo de imports
  ],
  controllers: [NursingCareController],
  providers: [
    RecordVitalSignsUseCase,
    GenerateCareProtocolUseCase,
    AdministerMedicationUseCase,
    GetVitalSignsHistoryUseCase,
    VitalSignsListener,
    { 
      provide: IVitalSignsRepository, 
      useClass: TypeOrmVitalSignsRepository 
    },
    {
      provide: IMedicationAdministrationRepository,
      useClass: TypeOrmMedicationAdministrationRepository,
    },
  ],
})
export class NursingCareModule {}