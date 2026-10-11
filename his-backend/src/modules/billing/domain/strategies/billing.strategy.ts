export interface IBillingStrategy {
  calculateCharges(baseCost: number): { patientAmount: number; thirdPartyAmount: number };
}

// Estrategia 1: Cobertura Pública (Subsidia 100%)
export class PublicCoverageStrategy implements IBillingStrategy {
  calculateCharges(baseCost: number) {
    return {
      patientAmount: 0,
      thirdPartyAmount: baseCost, // Facturado al Estado
    };
  }
}

// Estrategia 2: Medicina Prepaga (Copago Fijo)
export class PrepaidCoverageStrategy implements IBillingStrategy {
  constructor(private readonly fixedCopay: number = 3000) {}

  calculateCharges(baseCost: number) {
    return {
      patientAmount: this.fixedCopay,
      thirdPartyAmount: Math.max(0, baseCost - this.fixedCopay), // Resto a la prepaga
    };
  }
}

// Estrategia 3: Particular Sin Cobertura (100% al paciente)[cite: 1]
export class PrivateCoverageStrategy implements IBillingStrategy {
  calculateCharges(baseCost: number) {
    return {
      patientAmount: baseCost,
      thirdPartyAmount: 0,
    };
  }
}