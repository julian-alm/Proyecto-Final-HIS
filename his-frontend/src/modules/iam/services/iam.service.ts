import { apiClient } from '../../../core/api/axios.client';
import type { RegisterUserPayload } from '../types/auth.types';

export const iamService = {
  async registerUser(payload: RegisterUserPayload) {
    const response = await apiClient.post('/iam/register', payload);
    return response.data;
  },

  // NUEVO: Endpoint para listar todo el personal registrado
  async getUsers(): Promise<any[]> {
    const response = await apiClient.get('/iam/users');
    return response.data;
  }
};