import { VitalSigns } from '../entities/vital-signs.entity';

export interface IVitalSignsRepository {
  save(vitalSigns: VitalSigns): Promise<void>;
  findByPatientId(patientId: string): Promise<VitalSigns[]>; // <-- Agregamos esta línea
}

export const IVitalSignsRepository = Symbol('IVitalSignsRepository');