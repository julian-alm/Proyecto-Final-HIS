import { apiClient } from '../../../core/api/axios.client';
import type { BedItem, PatientLookup } from '../types/bed.types';

export const bedService = {
  // 1. Obtener todas las camas (el nuevo endpoint)
  async getBeds(): Promise<BedItem[]> {
    const response = await apiClient.get<BedItem[]>('/beds');
    return response.data;
  },

  // 2. Asignar cama (Requiere buscar primero paciente por DNI desde la vista)
  async assignBed(id: string, patientId: string): Promise<void> {
    await apiClient.patch(`/beds/${id}/assign`, { patientId });
  },

  // 3. Dar de Alta (Pasa a En Limpieza)
  async dischargeBed(id: string): Promise<void> {
    await apiClient.patch(`/beds/${id}/discharge`);
  },

  // 4. Confirmar Limpieza (Pasa a Libres)
  async cleanBed(id: string): Promise<void> {
    await apiClient.patch(`/beds/${id}/clean`);
  }, // <-- ¡Acá estaba faltando esta coma!

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