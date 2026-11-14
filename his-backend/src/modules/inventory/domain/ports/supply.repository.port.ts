import { SupplyMovementOrmEntity } from '../../infrastructure/persistence/supply-movement.orm-entity';
import { MedicalSupply } from '../entities/medical-supply.entity';

export const ISupplyRepository = Symbol('ISupplyRepository');

export interface ISupplyRepository {
    findByName(name: string): Promise<MedicalSupply | null>;
    save(supply: MedicalSupply, reason?: string): Promise<void>;
    decrementStockAtomically(name: string, quantity: number, reason?: string): Promise<MedicalSupply>;
    getMovementHistory(): Promise<SupplyMovementOrmEntity[]>;
    getCurrentStock(): Promise<{ medicationName: string; currentStock: number }[]>;   
}