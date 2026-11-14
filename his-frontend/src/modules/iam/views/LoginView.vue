<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth.store';
import LoginForm from '../components/LoginForm.vue'; // Importamos el nuevo componente

const router = useRouter();
const authStore = useAuthStore();

const errorMessage = ref('');
const isLoading = ref(false);

// Recibe el payload emitido por el LoginForm
const handleLogin = async (credentials: { email: string; passwordPlain: string }) => {
  try {
    errorMessage.value = '';
    isLoading.value = true;
    
    await authStore.login(credentials.email, credentials.passwordPlain);
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

        <!-- Instanciamos el componente y le pasamos los props y eventos -->
        <LoginForm 
          :is-loading="isLoading" 
          :error-message="errorMessage"
          @submit-login="handleLogin" 
        />
        
        <div class="login-footer">
          <p class="register-prompt">
            ¿Sos paciente y no tenés cuenta? 
            <!-- Asumimos que la ruta de registro será /register -->
            <RouterLink to="/register" class="register-link">Registrate acá</RouterLink>
          </p>
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

@media (max-width: 768px) {
  .login-layout {
    flex-direction: column;
  }
  .brand-panel {
    display: none;
  }
  .form-panel {
    padding: 1rem;
  }
}

.register-prompt {
  margin: 0 0 1rem 0;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 500;
}

.register-link {
  color: #0aa28a;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.register-link:hover {
  color: #088b76;
  text-decoration: underline;
}

.support-text {
  margin: 0;
  color: #94a3b8;
  font-size: 0.8rem;
}
</style>