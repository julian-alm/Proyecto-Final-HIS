import { MedicationAdministration } from '../entities/medication-administration.entity';

export const IMedicationAdministrationRepository = Symbol('IMedicationAdministrationRepository');

export interface IMedicationAdministrationRepository {
  save(administration: MedicationAdministration): Promise<void>;
}