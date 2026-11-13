import { Injectable, Inject } from '@nestjs/common';
import { ITriageRepository } from '../../domain/ports/triage.repository.port';
import { DomainException } from '../../../../shared/domain/domain-exception';
import { TriageEntry } from '../../domain/entities/triage-entry.entity';

@Injectable()
export class GetNextTriageUseCase {
    constructor(
        @Inject(ITriageRepository)
        private readonly triageRepository: ITriageRepository
    ) {}

    async execute(): Promise<TriageEntry> {
        const nextPatient = await this.triageRepository.getNextPatientToAttend();
        
        if (!nextPatient) {
            throw new DomainException('No hay pacientes en la cola de triaje en este momento.');
        }

        // Cambiamos el estado para sacarlo de la cola
        nextPatient.attend();
        await this.triageRepository.add(nextPatient);

        return nextPatient;
    }
}