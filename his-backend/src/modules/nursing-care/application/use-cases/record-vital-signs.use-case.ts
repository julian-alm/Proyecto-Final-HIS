import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VitalSigns } from '../../domain/entities/vital-signs.entity';
import { IVitalSignsRepository } from '../../domain/ports/vital-signs.repository.port';

export interface RecordVitalSignsCommand {
  patientId: string;
  temperature: number;
  bloodPressure: string;
  heartRate: number;
}

@Injectable()
export class RecordVitalSignsUseCase {
  constructor(
    @Inject(IVitalSignsRepository)
    private readonly vitalSignsRepository: IVitalSignsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: RecordVitalSignsCommand): Promise<VitalSigns> {
    const id = Math.random().toString(36).substring(2, 9);

    const vitalSigns = new VitalSigns(
      id,
      command.patientId,
      command.temperature,
      command.bloodPressure,
      command.heartRate
    );

    // Guardamos a través del Puerto en la BD de Enfermería
    await this.vitalSignsRepository.save(vitalSigns);

    // 👇 AGREGAMOS ESTE EVENTO PARA EL MÓDULO EHR 👇
    // Disparamos el evento para que la historia clínica lo atrape y anote
    this.eventEmitter.emit('vital-signs.registered', {
      patientId: vitalSigns.patientId,
      temperature: vitalSigns.temperature,
      bloodPressure: vitalSigns.bloodPressure,
      heartRate: vitalSigns.heartRate,
    });
    // ------------------------------------------------

    // Evaluamos las Reglas de Negocio de la HU 1.1 (Lo dejamos tal cual lo tenías)
    if (vitalSigns.hasHighFever()) {
      this.eventEmitter.emit('alert.high_fever', {
        patientId: vitalSigns.patientId,
        temperature: vitalSigns.temperature,
        timestamp: vitalSigns.recordedAt,
      });
    } else {
      this.eventEmitter.emit('nursing.note.automatic', {
        patientId: vitalSigns.patientId,
        message: 'Controles de signos vitales realizados con éxito. Parámetros estables.',
      });
    }

    return vitalSigns;
  }
}