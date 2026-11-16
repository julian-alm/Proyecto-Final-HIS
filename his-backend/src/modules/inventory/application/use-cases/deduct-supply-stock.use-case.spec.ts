import { DeductSupplyStockUseCase, DeductSupplyStockCommand } from './deduct-supply-stock.use-case';
import { ISupplyRepository } from '../../domain/ports/supply.repository.port';
import { MedicalSupply } from '../../domain/entities/medical-supply.entity';
import { DomainException } from '../../../../shared/domain/domain-exception';

class FakeSupplyRepository implements ISupplyRepository {
    public supplies: Map<string, MedicalSupply> = new Map();

    async findByName(name: string): Promise<MedicalSupply | null> {
        const key = Array.from(this.supplies.keys()).find(k => k.toLowerCase() === name.toLowerCase());
        return key ? this.supplies.get(key) || null : null;
    }

    async save(supply: MedicalSupply, reason?: string): Promise<void> {
        this.supplies.set(supply.name, supply);
    }

    async decrementStockAtomically(name: string, quantity: number, reason?: string): Promise<MedicalSupply> {
        const supply = await this.findByName(name);
        
        if (!supply) {
            throw new DomainException(`El insumo "${name}" no existe en el catálogo.`);
        }

        if (supply.stock < quantity) {
            throw new DomainException(
                `No se pudo descontar stock de "${name}" (Stock insuficiente: disponible ${supply.stock}, requerido ${quantity}).`
            );
        }

        const updatedSupply = new MedicalSupply(supply.id, supply.name, supply.stock - quantity, supply.description);
        this.supplies.set(supply.name, updatedSupply);
        return updatedSupply;
    }

    async getMovementHistory(): Promise<any[]> { return []; }
    async getCurrentStock(): Promise<any[]> { return []; }
}

describe('DeductSupplyStockUseCase', () => {
    let useCase: DeductSupplyStockUseCase;
    let fakeRepo: FakeSupplyRepository;

    beforeEach(() => {
        fakeRepo = new FakeSupplyRepository();
        useCase = new DeductSupplyStockUseCase(fakeRepo);
    });

    it('debería descontar el stock correctamente y retornar la entidad actualizada', async () => {
        // ARRANGE
        const initialSupply = new MedicalSupply('id-1', 'Ibuprofeno 400mg', 50, 'Analgesico');
        await fakeRepo.save(initialSupply);
        
        const command = new DeductSupplyStockCommand('Ibuprofeno 400mg', 10);

        // ACT
        const result = await useCase.execute(command);

        // ASSERT
        expect(result.stock).toBe(40);
        
        const savedSupply = await fakeRepo.findByName('Ibuprofeno 400mg');
        expect(savedSupply?.stock).toBe(40);
    });

    it('debería lanzar DomainException si el insumo no existe', async () => {
        // ARRANGE
        const command = new DeductSupplyStockCommand('Paracetamol 500mg', 5);

        // ACT & ASSERT
        await expect(useCase.execute(command)).rejects.toThrow(DomainException);
        await expect(useCase.execute(command)).rejects.toThrow('El insumo "Paracetamol 500mg" no existe en el catálogo.');
    });

    it('debería lanzar DomainException si el stock requerido es mayor al disponible', async () => {
        // ARRANGE
        const initialSupply = new MedicalSupply('id-2', 'Amoxicilina 500mg', 2, 'Antibiotico');
        await fakeRepo.save(initialSupply);
        
        const command = new DeductSupplyStockCommand('Amoxicilina 500mg', 10);

        // ACT & ASSERT
        await expect(useCase.execute(command)).rejects.toThrow(DomainException);
        await expect(useCase.execute(command)).rejects.toThrow(
            'No se pudo descontar stock de "Amoxicilina 500mg" (Stock insuficiente: disponible 2, requerido 10).'
        );
    });
});