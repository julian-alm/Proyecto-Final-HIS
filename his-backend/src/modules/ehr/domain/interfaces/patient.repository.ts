import { Patient } from '../entities/patient.entity';

export const IPatientRepository = Symbol('IPatientRepository');

export interface IPatientRepository {
    findById(id: string): Promise<Patient | null>;
    save(patient: Patient): Promise<void>;
}