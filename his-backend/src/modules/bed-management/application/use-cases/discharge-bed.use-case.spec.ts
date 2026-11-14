import { DischargeBedUseCase, DischargeBedCommand } from './discharge-bed.use-case';
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

describe('DischargeBedUseCase', () => {
    let useCase: DischargeBedUseCase;
    let fakeRepo: FakeBedRepository;
    let mockEventEmitter: jest.Mocked<EventEmitter2>;

    beforeEach(() => {
        fakeRepo = new FakeBedRepository();
        // Simulamos el emisor de eventos para no depender del framework
        mockEventEmitter = { emit: jest.fn() } as any;
        useCase = new DischargeBedUseCase(fakeRepo, mockEventEmitter);
    });

    it('debería dar de alta al paciente, pasar la cama a EN_LIMPIEZA y emitir evento', async () => {
        // ARRANGE
        const bed = new Bed('CAMA-101', 'Sala-1');
        bed.assign('pac-123'); // Estado: OCUPADA
        await fakeRepo.save(bed);
        const command = new DischargeBedCommand('CAMA-101');

        // ACT
        await useCase.execute(command);

        // ASSERT: Verificamos el estado (Caja Negra)
        const updatedBed = await fakeRepo.findById('CAMA-101');
        expect(updatedBed?.statusName).toBe('EN_LIMPIEZA');
        expect(updatedBed?.patientId).toBeNull();
        expect(mockEventEmitter.emit).toHaveBeenCalledWith('bed.status.changed', expect.any(Object));
    });

    it('debería lanzar excepción si la cama está libre', async () => {
        // ARRANGE
        const bed = new Bed('CAMA-102', 'Sala-2'); // Estado por defecto: LIBRE
        await fakeRepo.save(bed);
        
        // ACT & ASSERT
        await expect(useCase.execute(new DischargeBedCommand('CAMA-102')))
            .rejects.toThrow('No se puede dar de alta a una cama libre.');
    });
});