import { CalculateConsultationCostUseCase, CalculateCostCommand } from './calculate-consultation-cost.use-case';
import { ChargeOrmEntity } from '../../infrastructure/persistance/charge.orm-entity';
import { IChargeRepository } from '../../domain/ports/charge.repository.port';

// 1. FAKE TEST DOUBLE: Implementa el puerto exacto sin tocar TypeORM ni la base de datos.
class FakeChargeRepository implements IChargeRepository {
  public charges: ChargeOrmEntity[] = [];

  create(charge: Partial<ChargeOrmEntity>): ChargeOrmEntity {
    return charge as ChargeOrmEntity;
  }

  async save(charge: ChargeOrmEntity): Promise<ChargeOrmEntity> {
    this.charges.push(charge);
    return charge;
  }
}

describe('CalculateConsultationCostUseCase', () => {
  let useCase: CalculateConsultationCostUseCase;
  let fakeRepo: FakeChargeRepository;

  beforeEach(() => {
    fakeRepo = new FakeChargeRepository();
    // Inyección limpia y directa gracias a la Arquitectura Limpia
    useCase = new CalculateConsultationCostUseCase(fakeRepo);
  });

  it('debería calcular el costo y guardar un cargo para un paciente privado (100% paciente)', async () => {
    // ARRANGE
    const command: CalculateCostCommand = {
      patientId: 'pac-privado-1',
      coverageType: 'PRIVATE',
      consultationBaseCost: 15000,
    };

    // ACT
    const result = await useCase.execute(command);

    // ASSERT
    expect(result.message).toBe('Cargo guardado exitosamente en la base de datos');
    expect(result.patientAmount).toBe(15000); 
    expect(result.thirdPartyAmount).toBe(0);
    
    expect(fakeRepo.charges).toHaveLength(1);
    expect(fakeRepo.charges[0].patientId).toBe('pac-privado-1');
    expect(fakeRepo.charges[0].concept).toBe('Consulta Médica General');
  });

  it('debería calcular el costo y guardar un cargo para un paciente de cobertura pública (0% paciente)', async () => {
    // ARRANGE
    const command: CalculateCostCommand = {
      patientId: 'pac-publico-2',
      coverageType: 'PUBLIC',
      consultationBaseCost: 15000,
    };

    // ACT
    const result = await useCase.execute(command);

    // ASSERT
    expect(result.patientAmount).toBe(0);
    expect(result.thirdPartyAmount).toBe(15000);
    
    expect(fakeRepo.charges).toHaveLength(1);
    expect(fakeRepo.charges[0].patientId).toBe('pac-publico-2');
  });

  it('debería calcular el costo y guardar un cargo para un paciente con prepaga (copago fijo)', async () => {
    // ARRANGE
    const command: CalculateCostCommand = {
      patientId: 'pac-prepaga-3',
      coverageType: 'PREPAID',
      consultationBaseCost: 15000, 
    };

    // ACT
    const result = await useCase.execute(command);

    // ASSERT: Copago fijo de 3000
    expect(result.patientAmount).toBe(3000);
    expect(result.thirdPartyAmount).toBe(12000); 
    
    expect(fakeRepo.charges).toHaveLength(1);
    expect(fakeRepo.charges[0].patientAmount).toBe(3000);
  });
});