<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth.store';

// Inicializamos el router y el store de Pinia
const router = useRouter();
const authStore = useAuthStore();

// Variables reactivas (Estado local)
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  try {
    errorMessage.value = '';
    isLoading.value = true;
    
    // Llamamos a la acción del store que hace la petición a NestJS
    await authStore.login(email.value, password.value);
    
    // Si sale bien, el store guarda el token y redirigimos a la raíz del sistema
    router.push('/');
    
  } catch (error: any) {
    // Si el backend lanza el DomainException, lo capturamos aquí
    errorMessage.value = 
      error.response?.data?.message || 
      'Error de conexión. Revisa tus credenciales o intenta más tarde.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="title">Sistema HIS</h2>
      <p class="subtitle">Iniciar Sesión</p>

      <!-- Usamos @submit.prevent para evitar que la página se recargue al enviar el formulario -->
      <form @submit.prevent="handleLogin" class="login-form">
        
        <div class="input-group">
          <label for="email">Correo Electrónico</label>
          <input 
            id="email" 
            v-model="email" 
            type="email" 
            placeholder="admin@hospital.com" 
            required 
            :disabled="isLoading"
          />
        </div>

        <div class="input-group">
          <label for="password">Contraseña</label>
          <input 
            id="password" 
            v-model="password" 
            type="password" 
            placeholder="••••••••" 
            required 
            :disabled="isLoading"
          />
        </div>

        <!-- Feedback visual de error (Rúbrica: Experiencia de Usuario) -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <button type="submit" :disabled="isLoading" class="btn-submit">
          {{ isLoading ? 'Verificando credenciales...' : 'Ingresar al sistema' }}
        </button>
      </form>
    </div>
  </div>
</template>


<style scoped>
/* Estilos básicos limpios sin necesidad de librerías externas por ahora */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f4f6f8;
  font-family: Arial, sans-serif;
}

.login-card {
  background: white;
  padding: 2.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.title {
  text-align: center;
  margin: 0;
  color: #2c3e50;
  font-size: 1.8rem;
}

.subtitle {
  text-align: center;
  color: #7f8c8d;
  margin-bottom: 2rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-weight: bold;
  color: #34495e;
  font-size: 0.9rem;
}

.input-group input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.input-group input:focus {
  outline: none;
  border-color: #3498db;
}

.input-group input:disabled {
  background-color: #f9f9f9;
  cursor: not-allowed;
}

.btn-submit {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-submit:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-submit:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  background-color: #fadbd8;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
  text-align: center;
}
</style>