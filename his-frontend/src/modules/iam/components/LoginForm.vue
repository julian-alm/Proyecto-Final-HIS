<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  isLoading: boolean;
  errorMessage?: string;
}>();

const emit = defineEmits<{
  (e: 'submit-login', payload: { email: string; passwordPlain: string }): void
}>();

const email = ref('');
const password = ref('');

const onSubmit = () => {
  emit('submit-login', { 
    email: email.value, 
    passwordPlain: password.value 
  });
};
</script>

<template>
  <form @submit.prevent="onSubmit" class="login-form">
    <div class="input-group">
      <label for="email">Correo Electrónico</label>
      <input 
        id="email" 
        v-model="email" 
        type="email" 
        placeholder="Ej. admin@hishospital.org" 
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

    <!-- Feedback visual de error -->
    <div v-if="errorMessage" class="alert alert-error">
      {{ errorMessage }}
    </div>

    <button type="submit" :disabled="isLoading" class="btn-submit">
      {{ isLoading ? 'Verificando...' : 'Ingresar al sistema' }}
    </button>
  </form>
</template>

<style scoped>
.login-form {
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

.input-group input::placeholder {
  color: #94a3b8;
}

.input-group input:focus {
  border-color: #0aa28a;
  box-shadow: 0 0 0 3px rgba(10, 162, 138, 0.1);
}

.input-group input:disabled {
  background-color: #f1f5f9;
  cursor: not-allowed;
  color: #94a3b8;
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
  box-shadow: 0 2px 4px rgba(10, 162, 138, 0.2);
}

.btn-submit:hover:not(:disabled) {
  background-color: #088b76;
}

.btn-submit:disabled {
  background-color: #cbd5e1;
  box-shadow: none;
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