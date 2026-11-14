import { jest } from '@jest/globals';
import { RegisterPatientUseCase, RegisterPatientCommand } from './register-patient.use-case';
import { IUserRepository } from '../../domain/ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/entities/user-role.enum';
import { DomainException } from '../../../../shared/domain/domain-exception';
import * as bcrypt from 'bcrypt';

class FakeUserRepository extends IUserRepository {
  public users: Map<string, User> = new Map();

  async findByEmail(email: string): Promise<User | null> {
    const found = Array.from(this.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
    return found || null;
  }
  async save(user: User): Promise<User> { this.users.set(user.id, user); return user; }
  async findAll(): Promise<User[]> { return Array.from(this.users.values()); }
}

describe('RegisterPatientUseCase', () => {
  let useCase: RegisterPatientUseCase;
  let fakeRepo: FakeUserRepository;

  beforeEach(() => {
    fakeRepo = new FakeUserRepository();
    useCase = new RegisterPatientUseCase(fakeRepo);
  });

  it('debería registrar un paciente nuevo forzando el rol PATIENT', async () => {
    const command: RegisterPatientCommand = {
      fullName: 'Laura Paciente',
      email: 'laura@paciente.com',
      passwordPlain: 'Secreta123',
    };

    const result = await useCase.execute(command);

    // ASSERT: Verificamos que el sistema forzó el rol
    expect(result.id).toBeDefined();
    expect(result.fullName).toBe('Laura Paciente');
    expect(result.role).toBe('PATIENT'); 
    
    // Verificamos que la BD en memoria está actualizada y encriptada
    const savedUser = await fakeRepo.findByEmail('laura@paciente.com');
    expect(savedUser?.role).toBe('PATIENT');
    expect(savedUser?.passwordHash).not.toBe('Secreta123');
  });

  it('debería lanzar DomainException si el email ya existe', async () => {
    // ARRANGE: Un admin registrado previamente
    const passwordHash = await bcrypt.hash('123456', 10);
    const existing = new User('uuid-1', 'Admin', 'admin@hospital.com', passwordHash, 'ADMIN' as UserRole);
    await fakeRepo.save(existing);

    // ACT & ASSERT: Intentar registrarse como paciente usando el correo del Admin
    const command: RegisterPatientCommand = {
      fullName: 'Intentando Robar Correo',
      email: 'admin@hospital.com',
      passwordPlain: 'OtraClave123',
    };

    await expect(useCase.execute(command)).rejects.toThrow(DomainException);
    await expect(useCase.execute(command)).rejects.toThrow('El email admin@hospital.com ya está registrado.');
  });
});