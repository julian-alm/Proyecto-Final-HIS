import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class VitalSignsListener {
  
  // Escucha el evento del Escenario 2 (Fiebre Alta)
  @OnEvent('alert.high_fever')
  handleHighFeverAlert(payload: { patientId: string; temperature: number; timestamp: Date }) {
    console.log('\n🚨 [SISTEMA DE ALERTAS HIS - ALTA PRIORIDAD] 🚨');
    console.log(`Enviando notificación PUSH al buscapersonas/app del Médico de Guardia...`);
    console.log(`Motivo: Temperatura crítica de ${payload.temperature}°C detectada.`);
    console.log(`Paciente ID: ${payload.patientId} | Sector: Internación`);
    console.log(`(Instrucción a UI: Destacar registro visualmente en color ROJO)\n`);
  }

  // Escucha el evento del Escenario 1 (Signos Normales)
  @OnEvent('nursing.note.automatic')
  handleAutomaticNote(payload: { patientId: string; message: string }) {
    console.log(`\n📝 [HCE - NOTA DE ENFERMERÍA AUTOMÁTICA]`);
    console.log(`Paciente ID: ${payload.patientId}`);
    console.log(`Nota: "${payload.message}" (Guardado exitoso)\n`);
  }
}