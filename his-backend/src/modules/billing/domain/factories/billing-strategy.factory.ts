import { IBillingStrategy, PublicCoverageStrategy, PrepaidCoverageStrategy, PrivateCoverageStrategy } from '../strategies/billing.strategy';
import { DomainException } from '../../../../shared/domain/domain-exception';

export type CoverageType = 'PUBLIC' | 'PREPAID' | 'PRIVATE';

export class BillingStrategyFactory {
  static getStrategy(coverageType: CoverageType): IBillingStrategy {
    switch (coverageType) {
      case 'PUBLIC':
        return new PublicCoverageStrategy();
      case 'PREPAID':
        return new PrepaidCoverageStrategy(3000); // 3000 es el copago fijo del enunciado
      case 'PRIVATE':
        return new PrivateCoverageStrategy();
      default:
        throw new DomainException(`Tipo de cobertura desconocido: ${coverageType}`);
    }
  }
}