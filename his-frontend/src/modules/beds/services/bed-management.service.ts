import { apiClient } from '../../../core/api/axios.client';
import type { BedItem, PatientLookup } from '../types/bed.types';

export const bedService = {
  async getBeds(): Promise<BedItem[]> {
    const response = await apiClient.get<BedItem[]>('/beds');
    return response.data;
  },

  async assignBed(id: string, patientId: string): Promise<void> {
    await apiClient.patch(`/beds/${id}/assign`, { patientId });
  },

  async dischargeBed(id: string): Promise<void> {
    await apiClient.patch(`/beds/${id}/discharge`);
  },

  async cleanBed(id: string): Promise<void> {
    await apiClient.patch(`/beds/${id}/clean`);
  },

  async findPatientByDni(dni: string): Promise<PatientLookup> {
    const response = await apiClient.get<PatientLookup>(`/ehr/patients/dni/${encodeURIComponent(dni.trim())}`);
    return response.data;
  },

  async blockBed(id: string): Promise<void> {
    await apiClient.patch(`/beds/${id}/block`);
  },
  
  async unblockBed(id: string): Promise<void> {
    await apiClient.patch(`/beds/${id}/unblock`);
  }
};