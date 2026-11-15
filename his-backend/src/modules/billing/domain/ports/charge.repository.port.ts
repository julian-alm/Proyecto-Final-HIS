import { ChargeOrmEntity } from '../../infrastructure/persistance/charge.orm-entity';

export const IChargeRepository = Symbol('IChargeRepository');

export interface IChargeRepository {
  create(charge: Partial<ChargeOrmEntity>): ChargeOrmEntity;
  save(charge: ChargeOrmEntity): Promise<ChargeOrmEntity>;
}