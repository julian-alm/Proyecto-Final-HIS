import { Injectable, Inject } from '@nestjs/common';
import { IVitalSignsRepository } from '../../domain/ports/vital-signs.repository.port';
import { VitalSigns } from '../../domain/entities/vital-signs.entity';

@Injectable()
export class GetVitalSignsHistoryUseCase {
  constructor(
    @Inject(IVitalSignsRepository)
    private readonly vitalSignsRepository: IVitalSignsRepository,
  ) {}

  async execute(patientId: string): Promise<VitalSigns[]> {
    return this.vitalSignsRepository.findByPatientId(patientId);
  }
}