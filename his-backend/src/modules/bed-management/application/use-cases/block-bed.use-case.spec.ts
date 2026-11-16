import { BlockBedUseCase, BlockBedCommand } from './block-bed.use-case';
import { IBedRepository } from '../../domain/ports/bed.repository.port';
import { Bed } from '../../domain/entities/bed.entity';
import { DomainException } from '../../../../shared/domain/domain-exception';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { jest } from '@jest/globals';

class FakeBedRepository implements IBedRepository {
    public beds: Map<string, Bed> = new Map();
    async findById(id: string): Promise<Bed | null> { return this.beds.get(id) || null; }
    async save(bed: Bed): Promise<void> { this.beds.set(bed.id, bed); }
}

describe('BlockBedUseCase', () => {
    let useCase: BlockBedUseCase;
    let fakeRepo: FakeBedRepository;
    let mockEventEmitter: jest.Mocked<EventEmitter2>;

    beforeEach(() => {
        fakeRepo = new FakeBedRepository();
        mockEventEmitter = { emit: jest.fn() } as any;
        useCase = new BlockBedUseCase(fakeRepo, mockEventEmitter);
    });

    it('debería bloquear una cama libre y emitir evento', async () => {
        // ARRANGE
        const bed = new Bed('CAMA-101', 'Sala-1'); 
        await fakeRepo.save(bed);

        // ACT
        await useCase.execute(new BlockBedCommand('CAMA-101'));

        // ASSERT
        const updatedBed = await fakeRepo.findById('CAMA-101');
        expect(updatedBed?.statusName).toBe('BLOQUEADAS');
        expect(mockEventEmitter.emit).toHaveBeenCalled();
    });

    it('debería lanzar excepción si se intenta bloquear una cama ocupada', async () => {
        // ARRANGE
        const bed = new Bed('CAMA-102', 'Sala-2');
        bed.assign('pac-123'); 
        await fakeRepo.save(bed);

        // ACT & ASSERT
        await expect(useCase.execute(new BlockBedCommand('CAMA-102')))
            .rejects.toThrow('No se puede bloquear una cama ocupada por un paciente.');
    });
});