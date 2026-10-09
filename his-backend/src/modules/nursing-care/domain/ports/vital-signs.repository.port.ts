import { VitalSigns } from '../entities/vital-signs.entity';

export abstract class IVitalSignsRepository {
  abstract save(vitalSigns: VitalSigns): Promise<void>;
}