export interface IBillingStrategy {
  calculateCharges(baseCost: number): { patientAmount: number; thirdPartyAmount: number };
}


export class PublicCoverageStrategy implements IBillingStrategy {
  calculateCharges(baseCost: number) {
    return {
      patientAmount: 0,
      thirdPartyAmount: baseCost, 
    };
  }
}


export class PrepaidCoverageStrategy implements IBillingStrategy {
  constructor(private readonly fixedCopay: number = 3000) {}

  calculateCharges(baseCost: number) {
    return {
      patientAmount: this.fixedCopay,
      thirdPartyAmount: Math.max(0, baseCost - this.fixedCopay), 
    };
  }
}


export class PrivateCoverageStrategy implements IBillingStrategy {
  calculateCharges(baseCost: number) {
    return {
      patientAmount: baseCost,
      thirdPartyAmount: 0,
    };
  }
}