export type BillingCoverageType = 'PUBLIC' | 'PREPAID' | 'PRIVATE';

export interface PatientLookup {
  id: string;
  dni: string;
  firstName: string;
  lastName: string;
  coverageType: string;
}

export interface GenerateBillPayload {
  patientId: string;
  coverageType: BillingCoverageType;
  consultationBaseCost: number;
}

export interface CreatePricePayload {
  itemName: string;
  unitPrice: number;
}

export interface BillCalculationResponse {
  id?: string;
  patientId: string;
  coverageType?: BillingCoverageType;
  baseCost?: number;
  consultationBaseCost?: number;
  patientAmount?: number;
  thirdPartyAmount?: number;
  [key: string]: any; // Tolerante por si el caso de uso devuelve propiedades adicionales
}

export interface PriceItemResponse {
  message: string;
  item: {
    id?: string;
    itemName: string;
    unitPrice: number;
  };
}