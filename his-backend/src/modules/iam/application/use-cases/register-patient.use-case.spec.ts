import { RegisterPatientUseCase } from './register-patient.use-case';
import { DomainException } from '../../../../shared/domain/domain-exception';
import { jest } from '@jest/globals';

describe('RegisterPatientUseCase', () => {
  let useCase: RegisterPatientUseCase;
  let mockUserRepository: any;
  let mockEntityManager: any;

  beforeEach(() => {
    // 1. Mockeamos el repositorio de usuarios
    mockUserRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
    };
    
    // 2. Mockeamos el EntityManager que agregamos hoy
    mockEntityManager = {
      query: jest.fn(),
    };
    
    // Inyectamos ambos mocks al instanciar el caso de uso
    useCase = new RegisterPatientUseCase(mockUserRepository, mockEntityManager);
  });

  it('debería registrar un paciente nuevo y crear su registro clínico en blanco', async () => {
    // ARRANGE
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.save.mockImplementation(async (user: any) => user);
    
    // Simulamos que el SELECT por DNI devuelve vacío (el paciente no existe en la clínica)
    mockEntityManager.query.mockResolvedValue([]); 

    const command = {
      fullName: 'Juan Pérez',
      email: 'juan@correo.com',
      passwordPlain: '123456',
      dni: '30112455' // <-- Ahora mandamos el DNI
    };

    // ACT
    const result = await useCase.execute(command);

    // ASSERT
    expect(mockUserRepository.save).toHaveBeenCalled();
    // Debe haber llamado al query 2 veces: una para el SELECT y otra para el INSERT
    expect(mockEntityManager.query).toHaveBeenCalledTimes(2); 
    expect(mockEntityManager.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO patients'),
      expect.any(Array)
    );
    expect(result.email).toBe('juan@correo.com');
    expect(result.role).toBe('PATIENT');
  });

  it('debería enlazar a un paciente existente si el DNI ya está registrado en la clínica', async () => {
    // ARRANGE
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.save.mockImplementation(async (user: any) => ({ ...user, id: 'uuid-auth-123' }));
    
    // Simulamos que el paciente ya existe en la tabla patients
    mockEntityManager.query.mockResolvedValue([{ id: 'uuid-clinico-999' }]);

    const command = {
      fullName: 'Maria Gomez',
      email: 'maria@correo.com',
      passwordPlain: '123456',
      dni: '87654321'
    };

    // ACT
    await useCase.execute(command);

    // ASSERT
    // En lugar de un INSERT, debe haber ejecutado un UPDATE para enlazar el userId
    expect(mockEntityManager.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('UPDATE patients SET "userId"'),
      expect.arrayContaining(['uuid-auth-123', '87654321'])
    );
  });

  it('debería lanzar una DomainException si el email ya está registrado', async () => {
    // ARRANGE
    mockUserRepository.findByEmail.mockResolvedValue({ id: '1' });
    
    const command = {
      fullName: 'Error Test',
      email: 'existe@correo.com',
      passwordPlain: '123456',
      dni: '11111111'
    };

    // ACT & ASSERT
    await expect(useCase.execute(command)).rejects.toThrow(DomainException);
    // Verificamos que no haya intentado hacer nada en la BD si falló rápido
    expect(mockEntityManager.query).not.toHaveBeenCalled();
  });
});