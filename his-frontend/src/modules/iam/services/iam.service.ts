import { apiClient } from '../../../core/api/axios.client';
import type { RegisterUserPayload } from '../types/auth.types';

// Opcional pero recomendado: Exportar el tipado directo si no querés tocar auth.types.ts
export interface RegisterPatientPayload {
  fullName: string;
  email: string;
  passwordPlain: string;
  dni: string;
}

export const iamService = {
  async registerUser(payload: RegisterUserPayload) {
    const response = await apiClient.post('/iam/register', payload);
    return response.data;
  },

  async registerPatient(payload: RegisterPatientPayload) {
    const response = await apiClient.post('/iam/register/patient', payload);
    return response.data;
  },

  async getUsers(): Promise<any[]> {
    const response = await apiClient.get('/iam/users');
    return response.data;
  }
};