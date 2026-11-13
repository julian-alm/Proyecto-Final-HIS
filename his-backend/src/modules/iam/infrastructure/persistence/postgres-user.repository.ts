import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../domain/ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';
import { UserOrmEntity } from './user.orm-entity';

@Injectable()
export class PostgresUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly ormRepo: Repository<UserOrmEntity>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.ormRepo.findOne({ where: { email } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async save(user: User): Promise<User> {
    const ormEntity = this.ormRepo.create({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      isActive: user.isActive,
    });
    const saved = await this.ormRepo.save(ormEntity);
    return this.toDomain(saved);
  }

  
  private toDomain(orm: UserOrmEntity): User {
    return new User(orm.id, orm.fullName, orm.email, orm.passwordHash, orm.role, orm.isActive);
  }
}