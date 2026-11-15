import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MedicationAdministration } from '../../domain/entities/medication-administration.entity';
import { IMedicationAdministrationRepository } from '../../domain/ports/medication-administration.repository.port';
import { MedicationAdministeredEvent } from '../../../../shared/domain/events/medication-administered.event';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator'; // <-- Agregamos IsNumber

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

  // <-- AGREGAMOS QUANTITY: Así NestJS no te tira el error rojo
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

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

    // 1. Instanciamos la Entidad (sumamos el command.quantity)
    const administration = new MedicationAdministration(
      id,
      command.patientId,
      command.nurseId,
      command.medicationName,
      command.dose,
      command.quantity, // <-- Se lo pasamos al constructor de la entidad
      new Date(command.scheduledTime),
      new Date(command.administeredTime)
    );

    // 2. Persistimos a través del Puerto
    await this.repository.save(administration);

    // 3. Regla de Negocio: Emitimos el evento oficial
    const event = new MedicationAdministeredEvent(
      administration.patientId,
      administration.medicationName,
      command.quantity, // <-- SACAMOS EL 1 HARDCODEADO y pasamos la cantidad real
      administration.administeredTime
    );

    this.eventEmitter.emit('medication.administered', event);

    return administration;
  }
}