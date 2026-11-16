import { AssignBedUseCase, AssignBedCommand } from './assign-bed.use-case';
import { IBedRepository } from '../../domain/ports/bed.repository.port';
import { Bed } from '../../domain/entities/bed.entity';
import { DomainException } from '../../../../shared/domain/domain-exception';


class FakeBedRepository implements IBedRepository {
    public beds: Map<string, Bed> = new Map();

    async findById(id: string): Promise<Bed | null> {
        return this.beds.get(id) || null;
    }

    async save(bed: Bed): Promise<void> {
        this.beds.set(bed.id, bed);
    }
}

describe('AssignBedUseCase', () => {
    let useCase: AssignBedUseCase;
    let fakeRepo: FakeBedRepository;

    beforeEach(() => {
        fakeRepo = new FakeBedRepository();
        useCase = new AssignBedUseCase(fakeRepo);
    });

    it('debería asignar una cama y cambiar su estado a OCUPADAS cuando está libre', async () => {
        // ARRANGE
        const bed = new Bed('CAMA-101', 'Sala-1');
        await fakeRepo.save(bed);
        const command = new AssignBedCommand('CAMA-101', 'paciente-456');

        // ACT
        await useCase.execute(command);

        // ASSERT
        const updatedBed = await fakeRepo.findById('CAMA-101');
        expect(updatedBed).not.toBeNull();
        expect(updatedBed?.statusName).toBe('OCUPADAS'); 
        expect(updatedBed?.patientId).toBe('paciente-456');
    });

    it('debería lanzar una DomainException si la cama no existe', async () => {
        // ARRANGE
        const command = new AssignBedCommand('CAMA-INEXISTENTE', 'paciente-456');

        // ACT & ASSERT
        await expect(useCase.execute(command)).rejects.toThrow(DomainException);
        await expect(useCase.execute(command)).rejects.toThrow('Cama no encontrada en el sistema.');
    });

    it('debería lanzar una excepción si se intenta asignar una cama ya ocupada', async () => {
        // ARRANGE
        const bed = new Bed('CAMA-102', 'Sala-2');
        bed.assign('paciente-previo'); 
        await fakeRepo.save(bed);
        
        const command = new AssignBedCommand('CAMA-102', 'paciente-nuevo');

        // ACT & ASSERT
        await expect(useCase.execute(command)).rejects.toThrow(DomainException);
        await expect(useCase.execute(command)).rejects.toThrow('Error de concurrencia: La cama acaba de ser ocupada.');
    });

    it('debería lanzar una excepción si se intenta asignar una cama en proceso de limpieza', async () => {
        // ARRANGE
        const bed = new Bed('CAMA-103', 'Sala-3');
        bed.assign('paciente-previo');
        bed.discharge();              
        await fakeRepo.save(bed);
        
        const command = new AssignBedCommand('CAMA-103', 'paciente-nuevo');

        // ACT & ASSERT
        await expect(useCase.execute(command)).rejects.toThrow(DomainException);
        await expect(useCase.execute(command)).rejects.toThrow('No se puede asignar un paciente a una cama en limpieza.');
    });
});