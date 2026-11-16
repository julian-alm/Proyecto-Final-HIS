<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth.store';
import PatientRegisterForm from '../components/PatientRegisterForm.vue';
import ToastAlert from '../../../shared/components/ToastAlert.vue';

const router = useRouter();
const authStore = useAuthStore();

const errorMessage = ref('');
const isLoading = ref(false);

const toastRef = ref<InstanceType<typeof ToastAlert> | null>(null);

const handleRegister = async (data: { fullName: string; email: string; passwordPlain: string; dni: string }) => {
  try {
    errorMessage.value = '';
    isLoading.value = true;
    
    await authStore.registerPatient(data); 
    
    toastRef.value?.show('¡Registro exitoso! Redirigiendo al login...', 'success');
    
    setTimeout(() => {
      router.push('/login');
    }, 2000);
    
  } catch (error: any) {
    const msg = error.response?.data?.message || 'Ocurrió un error al intentar registrar la cuenta.';
    errorMessage.value = msg;
    
    toastRef.value?.show(msg, 'error');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="register-layout">
    <div class="form-panel">
      <div class="register-card">
        <div class="form-header">
          <h2>Portal de Pacientes</h2>
          <p>Creá tu cuenta para acceder a tu historial médico</p>
        </div>

        <PatientRegisterForm 
          :is-loading="isLoading" 
          :error-message="errorMessage"
          @submit-register="handleRegister" 
        />
        
        <div class="register-footer">
          <p class="login-prompt">
            ¿Ya tenés una cuenta? 
            <RouterLink to="/login" class="login-link">Iniciá sesión acá</RouterLink>
          </p>
        </div>
      </div>
    </div>
    
    <div class="brand-panel">
      <div class="brand-content">
        <div class="logo-box">+</div>
        <h1>HIS Hospital</h1>
        <p>Tu salud, en tus manos.</p>
      </div>
    </div>

    <!-- 3. Colocamos el componente en el template y lo vinculamos al ref -->
    <ToastAlert ref="toastRef" />
  </div>
</template>

<style scoped>
.register-layout {
  display: flex;
  min-height: 100vh;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
.brand-panel {
  flex: 1;
  background-color: #0f172a;
  color: white;
  display: flex; align-items: center; justify-content: center;
  padding: 3rem; position: relative; overflow: hidden;
}
.brand-panel::before {
  content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
  background: radial-gradient(circle at center, rgba(10, 162, 138, 0.08) 0%, transparent 50%);
}
.brand-content { position: relative; z-index: 1; max-width: 400px; text-align: center; display: flex; flex-direction: column; align-items: center; }
.logo-box { width: 56px; height: 56px; background-color: #0aa28a; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; margin-bottom: 1.5rem; }
.brand-content h1 { font-size: 2.5rem; margin: 0 0 0.5rem 0; }
.brand-content p { font-size: 1.1rem; color: #94a3b8; }
.form-panel { flex: 1; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; padding: 2rem; }
.register-card { background: white; padding: 3rem; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.03); width: 100%; max-width: 420px; border: 1px solid #f1f5f9; }
.form-header { margin-bottom: 2rem; }
.form-header h2 { margin: 0 0 0.5rem 0; color: #0f172a; font-size: 1.75rem; }
.form-header p { margin: 0; color: #64748b; font-size: 0.95rem; }
.register-footer { margin-top: 2rem; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 1.5rem; }
.login-prompt { margin: 0; color: #334155; font-size: 0.9rem; font-weight: 500; }
.login-link { color: #0aa28a; text-decoration: none; font-weight: 600; }
.login-link:hover { text-decoration: underline; color: #088b76; }
@media (max-width: 768px) {
  .register-layout { flex-direction: column-reverse; }
  .brand-panel { display: none; }
  .form-panel { padding: 1rem; }
}
</style>