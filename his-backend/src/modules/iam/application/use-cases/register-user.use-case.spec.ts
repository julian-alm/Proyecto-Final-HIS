import { jest } from '@jest/globals';
import { RegisterUserUseCase, RegisterUserCommand } from './register-user.use-case';
import { IUserRepository } from '../../domain/ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/entities/user-role.enum';
import { DomainException } from '../../../../shared/domain/domain-exception';

class FakeUserRepository extends IUserRepository {
  public users: Map<string, User> = new Map();

  async findByEmail(email: string): Promise<User | null> {
    const found = Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    return found || null;
  }

  async save(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }
}

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let fakeRepo: FakeUserRepository;

  beforeEach(() => {
    fakeRepo = new FakeUserRepository();
    useCase = new RegisterUserUseCase(fakeRepo);
  });

  it('debería registrar un usuario nuevo, encriptar su contraseña y guardarlo', async () => {
    // ARRANGE
    const command: RegisterUserCommand = {
      fullName: 'Carlos López',
      email: 'carlos.lopez@hospital.com',
      passwordPlain: 'Password123!',
      role: 'ADMIN' as UserRole, 
    };

    // ACT
    const result = await useCase.execute(command);

    // ASSERT
    expect(result.id).toBeDefined();
    expect(result.fullName).toBe('Carlos López');
    expect(result.email).toBe('carlos.lopez@hospital.com');
    
    const savedUser = await fakeRepo.findByEmail('carlos.lopez@hospital.com');
    expect(savedUser).not.toBeNull();
    expect(savedUser?.passwordHash).not.toBe('Password123!');
  });

  it('debería lanzar DomainException si el email ya está registrado', async () => {
    // ARRANGE
    const existingUser = new User(
      'uuid-123',
      'Doctor Existente',
      'doctor@hospital.com',
      'hashed_pass',
      'MEDICO' as UserRole
    );
    await fakeRepo.save(existingUser);

    const command: RegisterUserCommand = {
      fullName: 'Nuevo Doctor',
      email: 'doctor@hospital.com', 
      passwordPlain: '123456',
      role: 'MEDICO' as UserRole,
    };

    // ACT & ASSERT
    await expect(useCase.execute(command)).rejects.toThrow(DomainException);
    await expect(useCase.execute(command)).rejects.toThrow(
      'El email doctor@hospital.com ya está registrado en el hospital.'
    );
  });

  it('debería lanzar DomainException desde la Entidad si el formato del email es inválido', async () => {
    // ARRANGE
    const command: RegisterUserCommand = {
      fullName: 'Juan Sin Arroba',
      email: 'juan.hospital.com',
      passwordPlain: '123456',
      role: 'ENFERMERO' as UserRole,
    };

    // ACT & ASSERT
    await expect(useCase.execute(command)).rejects.toThrow(DomainException);
    await expect(useCase.execute(command)).rejects.toThrow(
      'El formato del email del usuario es inválido.'
    );
  });
});