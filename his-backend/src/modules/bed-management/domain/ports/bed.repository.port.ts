import { Bed } from '../entities/bed.entity';

export const IBedRepository = Symbol('IBedRepository');

export interface IBedRepository {
    findById(id: string): Promise<Bed | null>;
    save(bed: Bed): Promise<void>;
}