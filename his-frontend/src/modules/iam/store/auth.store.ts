import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiClient } from '../../../core/api/axios.client';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('accessToken'));
  const userRole = ref<string | null>(localStorage.getItem('userRole'));
  const userFullName = ref<string | null>(localStorage.getItem('userFullName'));
  const userId = ref<string | null>(localStorage.getItem('userId'));
  const userDni = ref<string | null>(localStorage.getItem('userDni'));

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => userRole.value === 'ADMIN');
  const currentUser = computed(() => ({
    id: userId.value,
    fullName: userFullName.value,
    role: userRole.value,
    dni: userDni.value,
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
      userDni.value = user.dni || null;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userFullName', user.fullName);
      localStorage.setItem('userId', user.id);
      if (user.dni) {
        localStorage.setItem('userDni', user.dni);
      }

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
    userDni.value = null;
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userFullName');
    localStorage.removeItem('userId');
    localStorage.removeItem('userDni');
  };

  const registerPatient = async (data: { fullName: string; email: string; passwordPlain: string; dni: string }) => { 
    try {
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
    userDni,
    isAuthenticated, 
    isAdmin,
    currentUser,
    login, 
    logout,
    registerPatient
  };
});