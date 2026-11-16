import { jest } from '@jest/globals';
import { GetUsersUseCase } from './get-users.use-case';
import { IUserRepository } from '../../domain/ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/entities/user-role.enum';

class FakeUserRepository extends IUserRepository {
  public users: Map<string, User> = new Map();

  async findByEmail(email: string): Promise<User | null> { return null; }
  async save(user: User): Promise<User> { this.users.set(user.id, user); return user; }
  async findAll(): Promise<User[]> { return Array.from(this.users.values()); }
}

describe('GetUsersUseCase', () => {
  let useCase: GetUsersUseCase;
  let fakeRepo: FakeUserRepository;

  beforeEach(() => {
    fakeRepo = new FakeUserRepository();
    useCase = new GetUsersUseCase(fakeRepo as any);
  });

  it('debería retornar un arreglo vacío si no hay usuarios', async () => {
    // ACT
    const result = await useCase.execute();

    // ASSERT
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  it('debería retornar todos los usuarios registrados', async () => {
    // ARRANGE
    const user1 = new User('1', 'Usuario 1', 'u1@hosp.com', 'hash', 'MEDICO' as UserRole);
    const user2 = new User('2', 'Usuario 2', 'u2@hosp.com', 'hash', 'ADMIN' as UserRole);
    await fakeRepo.save(user1);
    await fakeRepo.save(user2);

    // ACT
    const result = await useCase.execute();

    // ASSERT
    expect(result.length).toBe(2);
    expect(result[0].fullName).toBe('Usuario 1');
    expect(result[1].fullName).toBe('Usuario 2');
  });
});