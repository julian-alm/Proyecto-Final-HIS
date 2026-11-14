import { CleanBedUseCase, CleanBedCommand } from './clean-bed.use-case';
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

describe('CleanBedUseCase', () => {
    let useCase: CleanBedUseCase;
    let fakeRepo: FakeBedRepository;
    let mockEventEmitter: jest.Mocked<EventEmitter2>;

    beforeEach(() => {
        fakeRepo = new FakeBedRepository();
        mockEventEmitter = { emit: jest.fn() } as any;
        useCase = new CleanBedUseCase(fakeRepo, mockEventEmitter);
    });

    it('debería marcar la cama como limpia, pasarla a LIBRES y emitir evento', async () => {
        // ARRANGE
        const bed = new Bed('CAMA-101', 'Sala-1');
        bed.assign('pac-123'); 
        bed.discharge(); // Estado: EN_LIMPIEZA
        await fakeRepo.save(bed);

        // ACT
        await useCase.execute(new CleanBedCommand('CAMA-101'));

        // ASSERT
        const updatedBed = await fakeRepo.findById('CAMA-101');
        expect(updatedBed?.statusName).toBe('LIBRES');
        expect(mockEventEmitter.emit).toHaveBeenCalled();
    });

    it('debería lanzar excepción si se intenta limpiar una cama ocupada', async () => {
        // ARRANGE
        const bed = new Bed('CAMA-102', 'Sala-2');
        bed.assign('pac-123'); // Estado: OCUPADA
        await fakeRepo.save(bed);

        // ACT & ASSERT
        await expect(useCase.execute(new CleanBedCommand('CAMA-102')))
            .rejects.toThrow('Una cama ocupada no está en proceso de limpieza.');
    });
});