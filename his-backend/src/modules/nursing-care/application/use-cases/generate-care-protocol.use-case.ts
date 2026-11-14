import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { CareProtocol, PreOpProtocolBuilder, RespiratoryProtocolBuilder, FeverProtocolBuilder } from '../../domain/builders/care-protocol.builder';
// Importamos la interfaz del repo (ajustá los ../ según dónde esté tu módulo EHR)
import { IMedicalRecordRepository } from '../../../ehr/domain/interfaces/medical-record.repository';

export class GenerateProtocolCommand {
  patientId: string;
  admissionReason: string;
}

@Injectable()
export class GenerateCareProtocolUseCase {
  
  constructor(
    // Inyectamos el repo exactamente igual que en AddProgressNoteUseCase
    @Inject(IMedicalRecordRepository)
    private readonly medicalRecordRepository: IMedicalRecordRepository,
  ) {}

  async execute(command: GenerateProtocolCommand): Promise<CareProtocol> {
    const reason = command.admissionReason.toUpperCase();
    let protocol: CareProtocol;

    if (reason.includes('CIRUGIA') || reason.includes('PRE-QUIRURGICO')) {
      const builder = new PreOpProtocolBuilder();
      protocol = builder.buildForPatient(command.patientId);
      
    } else if (reason.includes('RESPIRATORIA') || reason.includes('NEUMONIA')) {
      const builder = new RespiratoryProtocolBuilder();
      protocol = builder.buildForPatient(command.patientId);
      
    } else if (reason.includes('FIEBRE')) {
      const builder = new FeverProtocolBuilder();
      protocol = builder.buildForPatient(command.patientId);
      
    } else {
      throw new BadRequestException('Motivo de ingreso no reconocido para generar protocolo automático');
    }

    // 1. Buscamos la HCE del paciente usando tu repo
    const record = await this.medicalRecordRepository.findByPatientId(command.patientId);
    
    // 2. Si no existe la HCE, tiramos el error igual que en tus otras clases
    if (!record) {
      throw new Error(`No se encontró la historia clínica del paciente ${command.patientId}.`);
    }

    // 3. Agregamos el protocolo (si tenés un método tipo record.addProtocol usalo, sino hacemos push)
    if (!record.careProtocols) {
      record.careProtocols = [];
    }
    record.careProtocols.push(protocol);

    // 4. Guardamos los cambios
    await this.medicalRecordRepository.save(record);

    return protocol;
  }
}