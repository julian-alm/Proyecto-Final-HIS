import { Injectable, Inject } from '@nestjs/common';
import { ITriageRepository } from '../../domain/ports/triage.repository.port';
import { TriageEntry } from '../../domain/entities/triage-entry.entity';
import { TriageLevel } from '../../domain/entities/triage-level.enum';
import { v4 as uuidv4 } from 'uuid'; // Puedes instalarlo con: npm install uuid && npm install -D @types/uuid

export class AddTriageCommand {
    constructor(
        public readonly patientId: string,
        public readonly level: TriageLevel,
        public readonly symptoms: string
    ) {}
}

@Injectable()
export class AddTriageUseCase {
    constructor(
        @Inject(ITriageRepository)
        private readonly triageRepository: ITriageRepository
    ) {}

    async execute(command: AddTriageCommand): Promise<string> {
        const entry = new TriageEntry(
            uuidv4(),
            command.patientId,
            command.level,
            command.symptoms
        );
        await this.triageRepository.add(entry);
        return entry.id;
    }
}