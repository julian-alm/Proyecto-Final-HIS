import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChargeOrmEntity } from './charge.orm-entity';
import { IChargeRepository } from '../../domain/ports/charge.repository.port';

@Injectable()
export class TypeOrmChargeRepository implements IChargeRepository {
  constructor(
    @InjectRepository(ChargeOrmEntity)
    private readonly ormRepository: Repository<ChargeOrmEntity>,
  ) {}

  create(charge: Partial<ChargeOrmEntity>): ChargeOrmEntity {
    return this.ormRepository.create(charge);
  }

  async save(charge: ChargeOrmEntity): Promise<ChargeOrmEntity> {
    return await this.ormRepository.save(charge);
  }
}