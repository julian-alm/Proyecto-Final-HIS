<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  isLoading: boolean;
  errorMessage?: string;
}>();

const emit = defineEmits<{
  (e: 'submit-register', payload: { fullName: string; email: string; passwordPlain: string; dni: string }): void
}>();

const fullName = ref('');
const dni = ref(''); 
const email = ref('');
const password = ref('');

const onSubmit = () => {
  emit('submit-register', { 
    fullName: fullName.value,
    email: email.value, 
    passwordPlain: password.value,
    dni: dni.value 
  });
};
</script>

<template>
  <form @submit.prevent="onSubmit" class="register-form">
    
    <div class="input-group">
      <label for="fullName">Nombre y Apellido</label>
      <input 
        id="fullName" 
        v-model="fullName" 
        type="text" 
        placeholder="Ej. Juan Pérez" 
        required 
        :disabled="isLoading"
      />
    </div>

    <!-- NUEVO CAMPO: DNI -->
    <div class="input-group">
      <label for="dni">Número de DNI</label>
      <input 
        id="dni" 
        v-model="dni" 
        type="text" 
        placeholder="Ej. 30112455" 
        required 
        :disabled="isLoading"
      />
    </div>

    <div class="input-group">
      <label for="email">Correo Electrónico</label>
      <input 
        id="email" 
        v-model="email" 
        type="email" 
        placeholder="ejemplo@correo.com" 
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
        placeholder="Mínimo 6 caracteres" 
        required 
        minlength="6"
        :disabled="isLoading"
      />
    </div>

    <div v-if="errorMessage" class="alert alert-error">
      {{ errorMessage }}
    </div>

    <button type="submit" :disabled="isLoading" class="btn-submit">
      {{ isLoading ? 'Creando cuenta...' : 'Registrarme como paciente' }}
    </button>
  </form>
</template>

<style scoped>
/* Usamos exactamente los mismos estilos que el LoginForm para mantener consistencia */
.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.input-group label {
  font-weight: 600;
  color: #334155;
  font-size: 0.85rem;
}
.input-group input {
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #0f172a;
  outline: none;
  transition: all 0.2s;
  background-color: white;
}
.input-group input:focus {
  border-color: #0aa28a;
  box-shadow: 0 0 0 3px rgba(10, 162, 138, 0.1);
}
.input-group input:disabled {
  background-color: #f1f5f9;
  cursor: not-allowed;
}
.btn-submit {
  background-color: #0aa28a;
  color: white;
  border: none;
  padding: 0.85rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 0.5rem;
}
.btn-submit:hover:not(:disabled) {
  background-color: #088b76;
}
.btn-submit:disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
}
.alert-error {
  background-color: #fef2f2;
  color: #dc2626;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  border: 1px solid #fecaca;
  font-weight: 500;
}
</style>