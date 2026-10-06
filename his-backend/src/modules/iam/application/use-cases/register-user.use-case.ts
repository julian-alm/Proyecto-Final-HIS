import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { IUserRepository } from '../../domain/ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/entities/user-role.enum';
import { DomainException } from '../../../../shared/domain/domain-exception';

export interface RegisterUserCommand {
  fullName: string;
  email: string;
  passwordPlain: string;
  role: UserRole;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(command: RegisterUserCommand) {
    const existing = await this.userRepository.findByEmail(command.email);
    if (existing) {
      throw new DomainException(`El email ${command.email} ya está registrado en el hospital.`);
    }

    const passwordHash = await bcrypt.hash(command.passwordPlain, 10);
    const newUser = new User(
      randomUUID(),
      command.fullName,
      command.email,
      passwordHash,
      command.role,
    );

    const saved = await this.userRepository.save(newUser);
    return {
      id: saved.id,
      fullName: saved.fullName,
      email: saved.email,
      role: saved.role,
    };
  }
}