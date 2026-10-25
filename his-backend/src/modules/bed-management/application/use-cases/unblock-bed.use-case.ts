import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IBedRepository } from '../../domain/ports/bed.repository.port';
import { DomainException } from '../../../../shared/domain/domain-exception';
import { BedStatusChangedEvent } from '../../domain/events/bed-status-changed.event';

export class UnblockBedCommand {
    constructor(public readonly bedId: string) {}
}

@Injectable()
export class UnblockBedUseCase {
    constructor(
        @Inject(IBedRepository)
        private readonly bedRepository: IBedRepository,
        private readonly eventEmitter: EventEmitter2
    ) {}

    async execute(command: UnblockBedCommand): Promise<void> {
        const bed = await this.bedRepository.findById(command.bedId);
        if (!bed) {
            throw new DomainException('Cama no encontrada en el sistema.');
        }

        // 1. El Patrón State valida y devuelve la cama a LIBRES
        bed.unblock();

        // 2. Persistimos con control de versión
        await this.bedRepository.save(bed);

        // 3. Emitimos evento para los monitores
        this.eventEmitter.emit(
            'bed.status.changed',
            new BedStatusChangedEvent(bed.id, bed.roomNumber, bed.statusName)
        );
    }
}