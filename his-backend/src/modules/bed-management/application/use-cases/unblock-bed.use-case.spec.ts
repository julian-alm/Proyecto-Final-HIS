import { UnblockBedUseCase, UnblockBedCommand } from './unblock-bed.use-case';
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

describe('UnblockBedUseCase', () => {
    let useCase: UnblockBedUseCase;
    let fakeRepo: FakeBedRepository;
    let mockEventEmitter: jest.Mocked<EventEmitter2>;

    beforeEach(() => {
        fakeRepo = new FakeBedRepository();
        mockEventEmitter = { emit: jest.fn() } as any;
        useCase = new UnblockBedUseCase(fakeRepo, mockEventEmitter);
    });

    it('debería desbloquear una cama y devolverla a LIBRES', async () => {
        // ARRANGE
        const bed = new Bed('CAMA-101', 'Sala-1');
        bed.block(); 
        await fakeRepo.save(bed);

        // ACT
        await useCase.execute(new UnblockBedCommand('CAMA-101'));

        // ASSERT
        const updatedBed = await fakeRepo.findById('CAMA-101');
        expect(updatedBed?.statusName).toBe('LIBRES');
        expect(mockEventEmitter.emit).toHaveBeenCalled();
    });

    it('debería lanzar excepción si la cama no está bloqueada', async () => {
        // ARRANGE
        const bed = new Bed('CAMA-102', 'Sala-2'); 
        await fakeRepo.save(bed);

        // ACT & ASSERT
        await expect(useCase.execute(new UnblockBedCommand('CAMA-102')))
            .rejects.toThrow('La cama no está bloqueada.');
    });
});