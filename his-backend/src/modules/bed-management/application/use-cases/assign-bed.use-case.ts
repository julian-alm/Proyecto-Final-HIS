import { Injectable, Inject } from '@nestjs/common';
import { IBedRepository } from '../../domain/ports/bed.repository.port';
import { DomainException } from '../../../../shared/domain/domain-exception';

export class AssignBedCommand {
    constructor(
        public readonly bedId: string,
        public readonly patientId: string
    ) {}
}

@Injectable()
export class AssignBedUseCase {
    constructor(
        @Inject(IBedRepository)
        private readonly bedRepository: IBedRepository
    ) {}

    async execute(command: AssignBedCommand): Promise<void> {
        const bed = await this.bedRepository.findById(command.bedId);

        if (!bed) {
            throw new DomainException('Cama no encontrada en el sistema.');
        }

        
        bed.assign(command.patientId);

        
        await this.bedRepository.save(bed);
    }
}