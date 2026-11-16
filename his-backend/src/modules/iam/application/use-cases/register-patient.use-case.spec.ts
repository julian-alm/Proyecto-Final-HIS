import { RegisterPatientUseCase } from './register-patient.use-case';
import { DomainException } from '../../../../shared/domain/domain-exception';
import { jest } from '@jest/globals';

describe('RegisterPatientUseCase', () => {
  let useCase: RegisterPatientUseCase;
  let mockUserRepository: any;
  let mockEntityManager: any;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
    };
    
    mockEntityManager = {
      query: jest.fn(),
    };
    
    useCase = new RegisterPatientUseCase(mockUserRepository, mockEntityManager);
  });

  it('debería registrar un paciente nuevo y crear su registro clínico en blanco', async () => {
    // ARRANGE
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.save.mockImplementation(async (user: any) => user);
    
    mockEntityManager.query.mockResolvedValue([]); 

    const command = {
      fullName: 'Juan Pérez',
      email: 'juan@correo.com',
      passwordPlain: '123456',
      dni: '30112455' 
    };

    // ACT
    const result = await useCase.execute(command);

    // ASSERT
    expect(mockUserRepository.save).toHaveBeenCalled();
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
    expect(mockEntityManager.query).not.toHaveBeenCalled();
  });
});