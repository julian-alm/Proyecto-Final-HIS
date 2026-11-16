import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from '../../domain/ports/user.repository.port';
import { DomainException } from '../../../../shared/domain/domain-exception';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

@Injectable()
export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    @InjectEntityManager() private readonly entityManager: EntityManager 
  ) {}

  async execute(email: string, passwordPlain: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.isActive) {
      throw new DomainException('Credenciales inválidas o usuario inactivo.');
    }

    const isPasswordValid = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isPasswordValid) {
      throw new DomainException('Credenciales inválidas o usuario inactivo.');
    }

    let patientDni = null;
    if (user.role === 'PATIENT') {
      const patientResult = await this.entityManager.query(`
        SELECT dni FROM patients WHERE "userId" = $1 LIMIT 1
      `, [user.id]);
      
      if (patientResult && patientResult.length > 0) {
        patientDni = patientResult[0].dni;
      }
    }

    const payload = { sub: user.id, email: user.email, role: user.role, fullName: user.fullName };
    
    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: { 
        id: user.id, 
        fullName: user.fullName, 
        role: user.role,
        dni: patientDni 
      },
    };
  }
}