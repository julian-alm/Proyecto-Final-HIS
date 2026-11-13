import { Injectable, BadRequestException } from '@nestjs/common';
import { CareProtocol, PreOpProtocolBuilder, RespiratoryProtocolBuilder } from '../../domain/builders/care-protocol.builder';

export class GenerateProtocolCommand {
  patientId: string;
  admissionReason: string;
}

@Injectable()
export class GenerateCareProtocolUseCase {
  
  async execute(command: GenerateProtocolCommand): Promise<CareProtocol> {
    const reason = command.admissionReason.toUpperCase();
    let protocol: CareProtocol;

    // El Caso de Uso evalúa la condición y elige el Builder adecuado
    if (reason.includes('CIRUGIA') || reason.includes('PRE-QUIRURGICO')) {
      const builder = new PreOpProtocolBuilder();
      protocol = builder.buildForPatient(command.patientId);
      
    } else if (reason.includes('RESPIRATORIA') || reason.includes('NEUMONIA')) {
      const builder = new RespiratoryProtocolBuilder();
      protocol = builder.buildForPatient(command.patientId);
      
    } else {
      throw new BadRequestException('Motivo de ingreso no reconocido para generar protocolo automático');
    }

    // Nota: Como este es un protocolo generado al vuelo, 
    // podrías retornarlo directo o guardarlo en una base de datos si lo necesitaras.
    return protocol;
  }
}