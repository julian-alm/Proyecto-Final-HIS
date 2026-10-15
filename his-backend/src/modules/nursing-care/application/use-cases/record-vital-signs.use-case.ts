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
    @Inject(IVitalSignsRepository) // <-- ¡Esta es la línea mágica que faltaba!
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

    // Guardamos a través del Puerto
    await this.vitalSignsRepository.save(vitalSigns);

    // Evaluamos las Reglas de Negocio de la HU 1.1
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