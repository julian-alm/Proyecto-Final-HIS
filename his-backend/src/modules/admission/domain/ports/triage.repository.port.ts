import { TriageEntry } from '../entities/triage-entry.entity';

export const ITriageRepository = Symbol('ITriageRepository');

export interface ITriageRepository {
    add(entry: TriageEntry): Promise<void>;
    getNextPatientToAttend(): Promise<TriageEntry | null>; // Aquí ocurrirá la magia de la cola
}