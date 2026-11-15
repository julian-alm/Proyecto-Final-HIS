import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiClient } from '../../../core/api/axios.client';

export const useAuthStore = defineStore('auth', () => {
  // Estado inicializado desde localStorage
  const token = ref<string | null>(localStorage.getItem('accessToken'));
  const userRole = ref<string | null>(localStorage.getItem('userRole'));
  const userFullName = ref<string | null>(localStorage.getItem('userFullName'));
  const userId = ref<string | null>(localStorage.getItem('userId'));

  // Getters (Propiedades computadas)
  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => userRole.value === 'ADMIN');
  const currentUser = computed(() => ({
    id: userId.value,
    fullName: userFullName.value,
    role: userRole.value,
  }));

  // Acciones
  const login = async (email: string, passwordPlain: string) => {
    try {
      const response = await apiClient.post('/iam/login', { email, passwordPlain });
      
      const { accessToken, user } = response.data;

      token.value = accessToken;
      userRole.value = user.role;
      userFullName.value = user.fullName;
      userId.value = user.id;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userFullName', user.fullName);
      localStorage.setItem('userId', user.id);

      return true;
    } catch (error) {
      console.error('Error en el login:', error);
      throw error;
    }
  };

  const logout = () => {
    token.value = null;
    userRole.value = null;
    userFullName.value = null;
    userId.value = null;
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userFullName');
    localStorage.removeItem('userId');
  };

  // NUEVA ACCIÓN: Registro exclusivo para pacientes
  const registerPatient = async (data: { fullName: string; email: string; passwordPlain: string }) => {
    try {
      // Hacemos el POST al endpoint público que creamos en el backend
      const response = await apiClient.post('/iam/register/patient', data);
      return response.data;
    } catch (error) {
      console.error('Error en el registro de paciente:', error);
      throw error;
    }
  };

  return { 
    token, 
    userRole, 
    userFullName,
    userId,
    isAuthenticated, 
    isAdmin,
    currentUser,
    login, 
    logout,
    registerPatient // Exportamos la nueva acción
  };
});