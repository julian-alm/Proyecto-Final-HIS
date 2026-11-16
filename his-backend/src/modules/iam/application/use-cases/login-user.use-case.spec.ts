import { jest } from '@jest/globals';
import * as bcrypt from 'bcrypt';
import { LoginUserUseCase } from './login-user.use-case';
import { IUserRepository } from '../../domain/ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/entities/user-role.enum';
import { DomainException } from '../../../../shared/domain/domain-exception';
import { JwtService } from '@nestjs/jwt';

// FAKE TEST DOUBLE
class FakeUserRepository extends IUserRepository {
  public users: Map<string, User> = new Map();

  async findByEmail(email: string): Promise<User | null> {
    const found = Array.from(this.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
    return found || null;
  }
  async save(user: User): Promise<User> { this.users.set(user.id, user); return user; }
  async findAll(): Promise<User[]> { return Array.from(this.users.values()); }
}

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase;
  let fakeRepo: FakeUserRepository;
  let mockJwtService: jest.Mocked<JwtService>;

 beforeEach(() => {
      fakeRepo = new FakeUserRepository();
      mockJwtService = { signAsync: jest.fn().mockImplementation(async () => 'fake-jwt-token') } as any;

      const mockEntityManager = {
        query: jest.fn().mockImplementation(async () => []) 
      } as any;

      useCase = new LoginUserUseCase(fakeRepo, mockJwtService, mockEntityManager);
    });

  it('debería retornar el token y los datos del usuario si las credenciales son correctas', async () => {
    // ARRANGE: Creamos un usuario con contraseña encriptada
    const passwordHash = await bcrypt.hash('123456', 10);
    const user = new User('uuid-1', 'Juan Perez', 'juan@hospital.com', passwordHash, 'MEDICO' as UserRole);
    await fakeRepo.save(user);

    // ACT
    const result = await useCase.execute('juan@hospital.com', '123456');

    // ASSERT
    expect(result.accessToken).toBe('fake-jwt-token');
    expect(result.user.fullName).toBe('Juan Perez');
    expect(result.user.role).toBe('MEDICO');
    expect(mockJwtService.signAsync).toHaveBeenCalled();
  });

  it('debería lanzar DomainException si el email no existe', async () => {
    // ACT & ASSERT
    await expect(useCase.execute('inexistente@hospital.com', '123456'))
      .rejects.toThrow('Credenciales inválidas o usuario inactivo.');
  });

  it('debería lanzar DomainException si la contraseña es incorrecta', async () => {
    // ARRANGE
    const passwordHash = await bcrypt.hash('123456', 10);
    const user = new User('uuid-2', 'Ana Gomez', 'ana@hospital.com', passwordHash, 'ENFERMERO' as UserRole);
    await fakeRepo.save(user);

    // ACT & ASSERT
    await expect(useCase.execute('ana@hospital.com', 'ClaveEquivocada'))
      .rejects.toThrow('Credenciales inválidas o usuario inactivo.');
  });

  it('debería lanzar DomainException si el usuario está inactivo', async () => {
    // ARRANGE
    const passwordHash = await bcrypt.hash('123456', 10);
    const user = new User('uuid-3', 'Luis Baja', 'luis@hospital.com', passwordHash, 'ADMIN' as UserRole, false);
    await fakeRepo.save(user);

    // ACT & ASSERT
    await expect(useCase.execute('luis@hospital.com', '123456'))
      .rejects.toThrow('Credenciales inválidas o usuario inactivo.');
  });
});