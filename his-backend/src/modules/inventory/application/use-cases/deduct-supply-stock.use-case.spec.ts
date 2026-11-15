import { DeductSupplyStockUseCase, DeductSupplyStockCommand } from './deduct-supply-stock.use-case';
import { ISupplyRepository } from '../../domain/ports/supply.repository.port';
import { MedicalSupply } from '../../domain/entities/medical-supply.entity';
import { DomainException } from '../../../../shared/domain/domain-exception';

// FAKE TEST DOUBLE: Simula el comportamiento atómico de TypeORM en memoria
class FakeSupplyRepository implements ISupplyRepository {
    public supplies: Map<string, MedicalSupply> = new Map();

    async findByName(name: string): Promise<MedicalSupply | null> {
        // Simulamos la búsqueda case-insensitive
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

        // Simulamos la deducción exitosa y retornamos una nueva entidad actualizada
        const updatedSupply = new MedicalSupply(supply.id, supply.name, supply.stock - quantity, supply.description);
        this.supplies.set(supply.name, updatedSupply); // Actualizamos el Fake
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
        // ARRANGE: Guardamos un insumo con stock inicial
        const initialSupply = new MedicalSupply('id-1', 'Ibuprofeno 400mg', 50, 'Analgesico');
        await fakeRepo.save(initialSupply);
        
        const command = new DeductSupplyStockCommand('Ibuprofeno 400mg', 10);

        // ACT
        const result = await useCase.execute(command);

        // ASSERT: El stock devuelto debe ser 40 (50 - 10)
        expect(result.stock).toBe(40);
        
        // Verificamos que el Fake guardó el nuevo estado
        const savedSupply = await fakeRepo.findByName('Ibuprofeno 400mg');
        expect(savedSupply?.stock).toBe(40);
    });

    it('debería lanzar DomainException si el insumo no existe', async () => {
        // ARRANGE: No guardamos nada en el Fake
        const command = new DeductSupplyStockCommand('Paracetamol 500mg', 5);

        // ACT & ASSERT
        await expect(useCase.execute(command)).rejects.toThrow(DomainException);
        await expect(useCase.execute(command)).rejects.toThrow('El insumo "Paracetamol 500mg" no existe en el catálogo.');
    });

    it('debería lanzar DomainException si el stock requerido es mayor al disponible', async () => {
        // ARRANGE: Guardamos un insumo con solo 2 unidades
        const initialSupply = new MedicalSupply('id-2', 'Amoxicilina 500mg', 2, 'Antibiotico');
        await fakeRepo.save(initialSupply);
        
        // Intentamos descontar 10
        const command = new DeductSupplyStockCommand('Amoxicilina 500mg', 10);

        // ACT & ASSERT
        await expect(useCase.execute(command)).rejects.toThrow(DomainException);
        await expect(useCase.execute(command)).rejects.toThrow(
            'No se pudo descontar stock de "Amoxicilina 500mg" (Stock insuficiente: disponible 2, requerido 10).'
        );
    });
});