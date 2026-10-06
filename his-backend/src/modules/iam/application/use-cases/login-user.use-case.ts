import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from '../../domain/ports/user.repository.port';
import { DomainException } from '../../../../shared/domain/domain-exception';

@Injectable()
export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
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

    const payload = { sub: user.id, email: user.email, role: user.role, fullName: user.fullName };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: { id: user.id, fullName: user.fullName, role: user.role },
    };
  }
}