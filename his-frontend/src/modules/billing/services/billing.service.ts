import { apiClient } from '../../../core/api/axios.client';
import type { GenerateBillPayload, CreatePricePayload, BillCalculationResponse, PriceItemResponse, PatientLookup } from '../types/billing.types';

export const billingService = {

  async findPatientByDni(dni: string): Promise<PatientLookup> {
    const response = await apiClient.get<PatientLookup>(`/ehr/patients/dni/${encodeURIComponent(dni.trim())}`);
    return response.data;
  },

  async calculateConsultation(payload: GenerateBillPayload): Promise<BillCalculationResponse> {
    const response = await apiClient.post<BillCalculationResponse>('/billing/calculate', payload);
    return response.data;
  },

  async savePrice(payload: CreatePricePayload): Promise<PriceItemResponse> {
    const response = await apiClient.post<PriceItemResponse>('/billing/prices', payload);
    return response.data;
  },
};