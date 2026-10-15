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

@Module({
  imports: [
    TypeOrmModule.forFeature([VitalSignsOrmEntity,MedicationAdministrationOrmEntity]) 
  ],
  controllers: [NursingCareController],
  providers: [
    RecordVitalSignsUseCase,
    GenerateCareProtocolUseCase,
    AdministerMedicationUseCase,
    GetVitalSignsHistoryUseCase,
    VitalSignsListener, // <--- Tiene que estar acá en la lista
    { provide: IVitalSignsRepository, useClass: TypeOrmVitalSignsRepository },
    {
    provide: IMedicationAdministrationRepository,
    useClass: TypeOrmMedicationAdministrationRepository,
  },
  ],
})
export class NursingCareModule {}