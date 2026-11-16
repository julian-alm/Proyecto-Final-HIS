import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from './auth.store';
import { apiClient } from '../../../core/api/axios.client';

vi.mock('../../../core/api/axios.client', () => ({
  apiClient: {
    post: vi.fn(),
  }
}));

describe('Auth Store (Pinia)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('debería iniciar sesión correctamente, guardar en estado y localStorage', async () => {
    const store = useAuthStore();
    
    // ARRANGE
    (apiClient.post as any).mockResolvedValue({
      data: {
        accessToken: 'fake-jwt-token',
        user: { id: 'uuid-1', fullName: 'Mariano Paciente', role: 'PATIENT' }
      }
    });

    // ACT
    const result = await store.login('mariano@paciente.com', 'ClaveSegura123');

    // ASSERT
    expect(result).toBe(true);
    expect(store.token).toBe('fake-jwt-token');
    expect(store.userRole).toBe('PATIENT');
    expect(store.isAuthenticated).toBe(true);
    expect(store.isAdmin).toBe(false);
    
    expect(localStorage.getItem('accessToken')).toBe('fake-jwt-token');
    expect(localStorage.getItem('userRole')).toBe('PATIENT');
    expect(apiClient.post).toHaveBeenCalledWith('/iam/login', { 
      email: 'mariano@paciente.com', 
      passwordPlain: 'ClaveSegura123' 
    });
  });

  it('debería limpiar el estado y el localStorage al cerrar sesión (logout)', () => {
    const store = useAuthStore();
    
    // ARRANGE
    store.token = 'token-viejo';
    store.userRole = 'ADMIN';
    localStorage.setItem('accessToken', 'token-viejo');
    localStorage.setItem('userRole', 'ADMIN');

    // ACT
    store.logout();

    // ASSERT
    expect(store.token).toBeNull();
    expect(store.userRole).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('userRole')).toBeNull();
  });

  it('debería registrar un paciente correctamente llamando al endpoint público', async () => {
    const store = useAuthStore();
    
    // ARRANGE
    const mockData = { id: 'uuid-2', fullName: 'Laura', role: 'PATIENT' };
    (apiClient.post as any).mockResolvedValue({ data: mockData });

    const payload = {
      fullName: 'Laura',
      email: 'laura@paciente.com',
      passwordPlain: '123456',
      dni: '12345678'
    };

    // ACT
    const result = await store.registerPatient(payload);

    // ASSERT
    expect(result).toEqual(mockData);
    expect(apiClient.post).toHaveBeenCalledWith('/iam/register/patient', payload);
  });
});