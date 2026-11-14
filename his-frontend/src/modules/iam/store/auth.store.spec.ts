import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from './auth.store';
import { apiClient } from '../../../core/api/axios.client';

// 1. Mockeamos la instancia de axios para no hacer peticiones reales al backend
vi.mock('../../../core/api/axios.client', () => ({
  apiClient: {
    post: vi.fn(),
  }
}));

describe('Auth Store (Pinia)', () => {
  beforeEach(() => {
    // 2. Antes de cada test, reiniciamos Pinia y el localStorage
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('debería iniciar sesión correctamente, guardar en estado y localStorage', async () => {
    const store = useAuthStore();
    
    // ARRANGE: Simulamos la respuesta exitosa del backend
    (apiClient.post as any).mockResolvedValue({
      data: {
        accessToken: 'fake-jwt-token',
        user: { id: 'uuid-1', fullName: 'Mariano Paciente', role: 'PATIENT' }
      }
    });

    // ACT: Ejecutamos la acción del store
    const result = await store.login('mariano@paciente.com', 'ClaveSegura123');

    // ASSERT: Verificamos que todo se guardó donde corresponde
    expect(result).toBe(true);
    expect(store.token).toBe('fake-jwt-token');
    expect(store.userRole).toBe('PATIENT');
    expect(store.isAuthenticated).toBe(true);
    expect(store.isAdmin).toBe(false); // Porque es PATIENT
    
    // Verificamos el localStorage
    expect(localStorage.getItem('accessToken')).toBe('fake-jwt-token');
    expect(localStorage.getItem('userRole')).toBe('PATIENT');
    expect(apiClient.post).toHaveBeenCalledWith('/iam/login', { 
      email: 'mariano@paciente.com', 
      passwordPlain: 'ClaveSegura123' 
    });
  });

  it('debería limpiar el estado y el localStorage al cerrar sesión (logout)', () => {
    const store = useAuthStore();
    
    // ARRANGE: Forzamos un estado de usuario logueado
    store.token = 'token-viejo';
    store.userRole = 'ADMIN';
    localStorage.setItem('accessToken', 'token-viejo');
    localStorage.setItem('userRole', 'ADMIN');

    // ACT
    store.logout();

    // ASSERT: Todo debe quedar vacío
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
      passwordPlain: '123456'
    };

    // ACT
    const result = await store.registerPatient(payload);

    // ASSERT
    expect(result).toEqual(mockData);
    expect(apiClient.post).toHaveBeenCalledWith('/iam/register/patient', payload);
  });
});