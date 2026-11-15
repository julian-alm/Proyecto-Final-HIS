import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { IUserRepository } from '../../domain/ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/entities/user-role.enum';
import { DomainException } from '../../../../shared/domain/domain-exception';

export interface RegisterPatientCommand {
  fullName: string;
  email: string;
  passwordPlain: string;
  // Fijate que quitamos el "role" de acá
}

@Injectable()
export class RegisterPatientUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(command: RegisterPatientCommand) {
    const existing = await this.userRepository.findByEmail(command.email);
    if (existing) {
      throw new DomainException(`El email ${command.email} ya está registrado.`);
    }

    const passwordHash = await bcrypt.hash(command.passwordPlain, 10);
    const newPatient = new User(
      randomUUID(),
      command.fullName,
      command.email,
      passwordHash,
      'PATIENT' as UserRole, // <- FORZAMOS EL ROL ACÁ
    );

    const saved = await this.userRepository.save(newPatient);
    return {
      id: saved.id,
      fullName: saved.fullName,
      email: saved.email,
      role: saved.role,
    };
  }
}