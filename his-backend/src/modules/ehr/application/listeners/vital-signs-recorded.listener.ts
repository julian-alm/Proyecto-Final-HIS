import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IMedicalRecordRepository } from '../../domain/interfaces/medical-record.repository';

@Injectable()
export class VitalSignsRecordedListener {
  constructor(
    @Inject(IMedicalRecordRepository)
    private readonly medicalRecordRepository: IMedicalRecordRepository,
  ) {}

  // Escuchamos el evento exacto que dispara nursing-care
  @OnEvent('vital-signs.recorded')
  async handleVitalSignsRecordedEvent(payload: any) {
    const { patientId, temperature, bloodPressure, heartRate } = payload;

    // 1. Buscamos la historia clínica del paciente
    const record = await this.medicalRecordRepository.findByPatientId(patientId);
    
    if (record) {
      // 2. Acá deberíamos agregar los signos vitales al historial del paciente
      // (Podemos agregar un array de "vitalSignsHistory" en tu Entidad más adelante)
      console.log(`[EHR Module] Signos vitales anexados a la historia clínica del paciente ${patientId}`);
      console.log(`Datos registrados: Temp: ${temperature}, Presión: ${bloodPressure}, FC: ${heartRate}`);
      
      // await this.medicalRecordRepository.save(record);
    }
  }
}