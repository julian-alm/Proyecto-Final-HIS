import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MedicationAdministration } from '../../domain/entities/medication-administration.entity';
import { IMedicationAdministrationRepository } from '../../domain/ports/medication-administration.repository.port';
import { MedicationAdministeredEvent } from '../../../../shared/domain/events/medication-administered.event';
import { IsString, IsNotEmpty } from 'class-validator';

export class AdministerMedicationCommand {
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  nurseId: string;

  @IsString()
  @IsNotEmpty()
  medicationName: string;

  @IsString()
  @IsNotEmpty()
  dose: string;

  @IsString()
  @IsNotEmpty()
  scheduledTime: string;

  @IsString()
  @IsNotEmpty()
  administeredTime: string;
}

@Injectable()
export class AdministerMedicationUseCase {
  constructor(
    @Inject(IMedicationAdministrationRepository)
    private readonly repository: IMedicationAdministrationRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: AdministerMedicationCommand): Promise<MedicationAdministration> {
    const id = Math.random().toString(36).substring(2, 9);

    // 1. Instanciamos la Entidad (Acá se ejecuta la regla de los +/- 30 min sola)
    const administration = new MedicationAdministration(
      id,
      command.patientId,
      command.nurseId,
      command.medicationName,
      command.dose,
      new Date(command.scheduledTime),
      new Date(command.administeredTime)
    );

    // 2. Persistimos a través del Puerto
    await this.repository.save(administration);

    // 3. Regla de Negocio: Emitimos el evento oficial con el patientId incluido para Inventario y Facturación
    const event = new MedicationAdministeredEvent(
      administration.patientId,
      administration.medicationName,
      1, // Cantidad de unidades administradas
      administration.administeredTime
    );

    this.eventEmitter.emit('medication.administered', event);

    return administration;
  }
}