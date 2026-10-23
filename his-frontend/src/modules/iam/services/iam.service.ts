import { apiClient } from '../../../core/api/axios.client';
import type { RegisterUserPayload } from '../types/auth.types';

export const iamService = {
  async registerUser(payload: RegisterUserPayload) {
    const response = await apiClient.post('/iam/register', payload);
    return response.data;
  },
};