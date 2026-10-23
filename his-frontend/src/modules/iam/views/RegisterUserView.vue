<script setup lang="ts">
import { reactive, ref } from 'vue';
import { iamService } from '../services/iam.service';
import type { RegisterUserPayload } from '../types/auth.types';

const form = reactive<RegisterUserPayload>({
  fullName: '',
  email: '',
  passwordPlain: '',
  role: '',
});

const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const handleRegister = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (form.passwordPlain.length < 6) {
    errorMessage.value = 'La contraseña debe tener al menos 6 caracteres.';
    return;
  }

  try {
    isLoading.value = true;
    await iamService.registerUser({ ...form });

    successMessage.value = `¡Usuario "${form.fullName}" (${form.role}) registrado exitosamente!`;

    // Limpiamos el formulario para permitir cargar otro usuario
    form.fullName = '';
    form.email = '';
    form.passwordPlain = '';
    form.role = '';
  } catch (error: any) {
    const backendMsg = error.response?.data?.message;
    errorMessage.value = Array.isArray(backendMsg)
      ? backendMsg.join(', ')
      : backendMsg || 'No se pudo registrar el usuario. Verifique los datos o el rol.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="register-page">
    <div class="header-section">
      <h1>Gestión de Personal (IAM)</h1>
      <p>Alta de nuevos profesionales y administrativos en el sistema hospitalario.</p>
    </div>

    <div class="form-card">
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="input-group">
          <label for="fullName">Nombre Completo</label>
          <input
            id="fullName"
            v-model.trim="form.fullName"
            type="text"
            placeholder="Ej: Dra. Laura Gómez"
            required
            :disabled="isLoading"
          />
        </div>

        <div class="input-group">
          <label for="email">Correo Electrónico Institucional</label>
          <input
            id="email"
            v-model.trim="form.email"
            type="email"
            placeholder="laura.gomez@hospital.com"
            required
            :disabled="isLoading"
          />
        </div>

        <div class="form-row">
          <div class="input-group">
            <label for="password">Contraseña Temporal (Mín. 6 caracteres)</label>
            <input
              id="password"
              v-model="form.passwordPlain"
              type="password"
              placeholder="••••••"
              minlength="6"
              required
              :disabled="isLoading"
            />
          </div>

          <div class="input-group">
            <label for="role">Rol en el Hospital</label>
            <select id="role" v-model="form.role" required :disabled="isLoading">
              <option value="" disabled>Seleccione un rol...</option>
              <!-- Ajusta el "value" si en tu user-role.enum.ts tienen otro texto exacto -->
              <option value="DOCTOR">Médico</option>
              <option value="NURSE">Enfermero/a</option>
              <option value="RECEPCIONI">Recepcionista</option>
              <option value="ADMIN">Administrador (ADMIN)</option>
              <option value="CLEANER">Personal de Limpieza</option>
            </select>
          </div>
        </div>

        <!-- Mensajes de Feedback (UX/UI) -->
        <div v-if="errorMessage" class="alert alert-error">
          {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="alert alert-success">
          {{ successMessage }}
        </div>

        <div class="actions">
          <button type="submit" class="btn-primary" :disabled="isLoading">
            {{ isLoading ? 'Registrando usuario...' : 'Registrar Usuario' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>


<style scoped>
.register-page {
  max-width: 750px;
  margin: 0 auto;
}

.header-section {
  margin-bottom: 1.5rem;
}

.header-section h1 {
  color: #2c3e50;
  margin: 0 0 0.4rem 0;
}

.header-section p {
  color: #7f8c8d;
  margin: 0;
}

.form-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.input-group label {
  font-weight: bold;
  font-size: 0.9rem;
  color: #34495e;
}

.input-group input,
.input-group select {
  padding: 0.7rem;
  border: 1px solid #dce1e7;
  border-radius: 6px;
  font-size: 0.95rem;
  background-color: #fff;
}

.input-group input:focus,
.input-group select:focus {
  outline: none;
  border-color: #3498db;
}

.alert {
  padding: 0.85rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
}

.alert-error {
  background-color: #fadbd8;
  color: #c0392b;
}

.alert-success {
  background-color: #d4efdf;
  color: #1e8449;
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.btn-primary {
  background-color: #2ecc71;
  color: white;
  border: none;
  padding: 0.8rem 1.6rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background-color: #27ae60;
}

.btn-primary:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}
</style>