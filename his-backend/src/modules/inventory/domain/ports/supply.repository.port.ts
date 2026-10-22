import { MedicalSupply } from '../entities/medical-supply.entity';

export const ISupplyRepository = Symbol('ISupplyRepository');

export interface ISupplyRepository {
    findByName(name: string): Promise<MedicalSupply | null>;
    save(supply: MedicalSupply): Promise<void>;
    decrementStockAtomically(name: string, quantity: number): Promise<MedicalSupply>;
}