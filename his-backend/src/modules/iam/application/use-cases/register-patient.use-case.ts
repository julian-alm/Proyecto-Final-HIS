import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { IUserRepository } from '../../domain/ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/entities/user-role.enum';
import { DomainException } from '../../../../shared/domain/domain-exception';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

export interface RegisterPatientCommand {
  fullName: string;
  email: string;
  passwordPlain: string;
  dni: string;
}

@Injectable()
export class RegisterPatientUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    // Inyectamos el EntityManager para poder tocar la tabla 'patients' del otro módulo
    @InjectEntityManager() private readonly entityManager: EntityManager
  ) {}

  async execute(command: RegisterPatientCommand) {
    const existing = await this.userRepository.findByEmail(command.email);
    if (existing) {
      throw new DomainException(`El email ${command.email} ya está registrado.`);
    }

    // 1. Creamos la cuenta de inicio de sesión (User)
    const passwordHash = await bcrypt.hash(command.passwordPlain, 10);
    const newUserId = randomUUID();
    
    const newPatientAuth = new User(
      newUserId,
      command.fullName,
      command.email,
      passwordHash,
      'PATIENT' as UserRole,
    );
    const savedUser = await this.userRepository.save(newPatientAuth);

    // 2. LÓGICA DE ENLACE: Buscamos si el paciente clínico ya existe por DNI
    const existingPatientList = await this.entityManager.query(`
      SELECT id FROM patients WHERE dni = $1 LIMIT 1
    `, [command.dni]);

    if (existingPatientList && existingPatientList.length > 0) {
      // 3A. Ya existía: Simplemente le asignamos su nuevo userId para enlazar la historia
      await this.entityManager.query(`
        UPDATE patients SET "userId" = $1 WHERE dni = $2
      `, [savedUser.id, command.dni]);
    } else {
      // 3B. No existía: Creamos el paciente clínico en blanco y lo enlazamos
      const names = command.fullName.split(' ');
      const firstName = names[0];
      const lastName = names.slice(1).join(' ') || '';
      
      await this.entityManager.query(`
        INSERT INTO patients (id, dni, "firstName", "lastName", "coverageType", "userId")
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [randomUUID(), command.dni, firstName, lastName, 'PRIVATE', savedUser.id]);
    }

    return {
      id: savedUser.id,
      fullName: savedUser.fullName,
      email: savedUser.email,
      role: savedUser.role,
    };
  }
}