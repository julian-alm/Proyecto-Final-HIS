import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AddProgressNoteUseCase } from '../use-cases/add-progress-note.use-case';

@Injectable()
export class VitalSignsListener {
  constructor(private readonly addProgressNoteUseCase: AddProgressNoteUseCase) {}

  // Este es el nombre del evento que Enfermería va a emitir
  @OnEvent('vital-signs.registered')
  async handleVitalSignsRegisteredEvent(event: any) {
    console.log('EHR Module: Escuchando evento de signos vitales para el paciente', event.patientId);
    
    // Armamos el texto que va a ir en la historia clínica
    const noteText = `Registro de Enfermería - Temp: ${event.temperature}°C, Presión: ${event.bloodPressure}, Ritmo Cardíaco: ${event.heartRate} lpm.`;

    try {
      await this.addProgressNoteUseCase.execute({
        patientId: event.patientId,
        doctorId: 'SISTEMA-ENFERMERIA', // Usamos un ID genérico para saber que vino automático
        note: noteText,
      });
      console.log('EHR Module: Signos vitales anexados a la historia clínica exitosamente.');
    } catch (error) {
      console.error('EHR Module: Error al anexar signos vitales:', error);
    }  }
}