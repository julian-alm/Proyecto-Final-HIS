import { jest } from '@jest/globals';
import { RegisterUserUseCase, RegisterUserCommand } from './register-user.use-case';
import { IUserRepository } from '../../domain/ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/entities/user-role.enum';
import { DomainException } from '../../../../shared/domain/domain-exception';

// FAKE TEST DOUBLE: Simula la base de datos de usuarios en memoria
class FakeUserRepository extends IUserRepository {
  public users: Map<string, User> = new Map();

  async findByEmail(email: string): Promise<User | null> {
    // Buscamos ignorando mayúsculas/minúsculas para mayor robustez
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
    // Nota: Casteamos el string al enum UserRole para evitar errores de tipado si no lo tenemos importado exacto
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
    
    // Verificamos el estado en el Fake Repository
    const savedUser = await fakeRepo.findByEmail('carlos.lopez@hospital.com');
    expect(savedUser).not.toBeNull();
    // Validamos que la contraseña se haya encriptado (no debe ser la plana)
    expect(savedUser?.passwordHash).not.toBe('Password123!');
  });

  it('debería lanzar DomainException si el email ya está registrado', async () => {
    // ARRANGE: Pre-cargamos un usuario en el repositorio
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
      email: 'doctor@hospital.com', // Mismo email
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
    // ARRANGE: Un email sin el arroba
    const command: RegisterUserCommand = {
      fullName: 'Juan Sin Arroba',
      email: 'juan.hospital.com',
      passwordPlain: '123456',
      role: 'ENFERMERO' as UserRole,
    };

    // ACT & ASSERT: El caso de uso intentará instanciar `new User(...)` y la validación interna fallará
    await expect(useCase.execute(command)).rejects.toThrow(DomainException);
    await expect(useCase.execute(command)).rejects.toThrow(
      'El formato del email del usuario es inválido.'
    );
  });
});