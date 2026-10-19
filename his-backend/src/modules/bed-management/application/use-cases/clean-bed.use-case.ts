import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IBedRepository } from '../../domain/ports/bed.repository.port';
import { DomainException } from '../../../../shared/domain/domain-exception';
import { BedStatusChangedEvent } from '../../domain/events/bed-status-changed.event';

export class CleanBedCommand {
    constructor(public readonly bedId: string) {}
}

@Injectable()
export class CleanBedUseCase {
    constructor(
        @Inject(IBedRepository)
        private readonly bedRepository: IBedRepository,
        private readonly eventEmitter: EventEmitter2
    ) {}

    async execute(command: CleanBedCommand): Promise<void> {
        const bed = await this.bedRepository.findById(command.bedId);
        if (!bed) {
            throw new DomainException('Cama no encontrada en el sistema.');
        }

        // 1. El Patrón State valida que esté EN_LIMPIEZA y la pasa a LIBRES
        bed.markAsClean();

        // 2. Guardamos en PostgreSQL
        await this.bedRepository.save(bed);

        // 3. Notificamos al monitor del mapa de camas que ya está disponible
        this.eventEmitter.emit(
            'bed.status.changed',
            new BedStatusChangedEvent(bed.id, bed.roomNumber, bed.statusName)
        );
    }
}