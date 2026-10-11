import { TriageLevel } from './triage-level.enum';
import { DomainException } from '../../../../shared/domain/domain-exception';

export class TriageEntry {
    constructor(
        public readonly id: string,
        public readonly patientId: string,
        public readonly level: TriageLevel,
        public readonly symptoms: string,
        public readonly arrivalTime: Date = new Date(),
        public status: string = 'EN_ESPERA'
    ) {}

    attend(): void {
        if (this.status !== 'EN_ESPERA') {
            throw new DomainException('El paciente ya fue atendido o retirado del triaje.');
        }
        this.status = 'ATENDIDO';
    }
}