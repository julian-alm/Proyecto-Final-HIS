import { Injectable } from '@nestjs/common';

import { PreOpProtocolBuilder, CareProtocol } from '../domain/builders/care-protocol.builder';

export class GenerateProtocolCommand {
  constructor(
    public readonly patientId: string,
    public readonly admissionReason: string
  ) {}
}

@Injectable()
export class GenerateCareProtocolUseCase {
  
  execute(command: GenerateProtocolCommand): CareProtocol {
    if (command.admissionReason === 'PRE_OP') {
      const builder = new PreOpProtocolBuilder();
      return builder.buildForPatient(command.patientId);
    }

    throw new Error('Motivo de ingreso no reconocido para generar un protocolo.');
  }
}