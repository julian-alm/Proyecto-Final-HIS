<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth.store';

// Inicializamos el router y el store de Pinia
const router = useRouter();
const authStore = useAuthStore();

// Variables reactivas
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  try {
    errorMessage.value = '';
    isLoading.value = true;
    
    await authStore.login(email.value, password.value);
    
    // El router index se encarga de redirigir según el rol
    router.push('/');
    
  } catch (error: any) {
    errorMessage.value = 
      error.response?.data?.message || 
      'Error de conexión. Revisa tus credenciales.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="login-layout">
    <!-- Panel Izquierdo: Branding Corporativo -->
    <div class="brand-panel">
      <div class="brand-content">
        <div class="logo-box">+</div>
        <h1>HIS Hospital</h1>
        <p>Sistema Integral de Información y Gestión Hospitalaria</p>
        
        <div class="features">
          <div class="feature-item">
            <span class="check">✓</span> Acceso seguro y encriptado
          </div>
          <div class="feature-item">
            <span class="check">✓</span> Gestión centralizada de pacientes
          </div>
          <div class="feature-item">
            <span class="check">✓</span> Monitoreo en tiempo real
          </div>
        </div>
      </div>
    </div>

    <!-- Panel Derecho: Formulario de Login -->
    <div class="form-panel">
      <div class="login-card">
        <div class="form-header">
          <h2>Iniciar sesión</h2>
          <p>Ingresá tus credenciales para acceder al sistema</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          
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
        
        <div class="login-footer">
          <p>¿Problemas para ingresar? Contactá a Soporte IT.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Tipografía global para la vista */
.login-layout {
  display: flex;
  min-height: 100vh;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* --- PANEL IZQUIERDO (Branding) --- */
.brand-panel {
  flex: 1;
  background-color: #0f172a;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  position: relative;
  overflow: hidden;
}

/* Patrón de fondo sutil simulado con gradientes */
.brand-panel::before {
  content: '';
  position: absolute;
  top: -50%; left: -50%; width: 200%; height: 200%;
  background: radial-gradient(circle at center, rgba(10, 162, 138, 0.08) 0%, transparent 50%);
  pointer-events: none;
}

.brand-content {
  max-width: 400px;
  position: relative;
  z-index: 1;
}

.logo-box {
  width: 56px;
  height: 56px;
  background-color: #0aa28a;
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 20px rgba(10, 162, 138, 0.4);
}

.brand-content h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.5px;
}

.brand-content p {
  font-size: 1.1rem;
  color: #94a3b8;
  line-height: 1.5;
  margin-bottom: 3rem;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;
  color: #e2e8f0;
}

.check {
  background-color: rgba(10, 162, 138, 0.2);
  color: #10b981;
  width: 24px; height: 24px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; font-weight: bold;
}

/* --- PANEL DERECHO (Formulario) --- */
.form-panel {
  flex: 1;
  background-color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-card {
  background: white;
  padding: 3rem;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.03), 0 4px 10px rgba(0,0,0,0.02);
  width: 100%;
  max-width: 420px;
  border: 1px solid #f1f5f9;
}

.form-header {
  margin-bottom: 2rem;
}

.form-header h2 {
  margin: 0 0 0.5rem 0;
  color: #0f172a;
  font-size: 1.75rem;
  font-weight: 700;
}

.form-header p {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
}

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

.login-footer {
  margin-top: 2rem;
  text-align: center;
  border-top: 1px solid #f1f5f9;
  padding-top: 1.5rem;
}

.login-footer p {
  margin: 0;
  color: #94a3b8;
  font-size: 0.85rem;
}

/* Responsividad para móviles */
@media (max-width: 768px) {
  .login-layout {
    flex-direction: column;
  }
  .brand-panel {
    display: none; /* Oculta el panel izquierdo en móviles para priorizar el login */
  }
  .form-panel {
    padding: 1rem;
  }
}
</style>