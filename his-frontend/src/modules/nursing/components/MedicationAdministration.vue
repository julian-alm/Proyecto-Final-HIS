<script setup lang="ts">
import { ref, computed } from 'vue';
import { EhrNursingService } from '../services/ehr-nursing.service';
import ToastAlert from '../../../shared/components/ToastAlert.vue';
import { useAuthStore } from '../../iam/store/auth.store'; // Conectamos tu AuthStore real

const props = defineProps<{ patientId: string }>();
const emit = defineEmits(['medicationAdministered']);

const authStore = useAuthStore(); 
const toastRef = ref<InstanceType<typeof ToastAlert> | null>(null);

const getCurrentDateTimeLocal = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const form = ref({
  medicationName: '',
  dose: '',
  quantity: 1,
  scheduledTime: getCurrentDateTimeLocal(),
  administeredTime: getCurrentDateTimeLocal()
});

const isSubmitting = ref(false);

const timeDifferenceMinutes = computed(() => {
  if (!form.value.scheduledTime || !form.value.administeredTime) return 0;
  const scheduled = new Date(form.value.scheduledTime).getTime();
  const administered = new Date(form.value.administeredTime).getTime();
  return Math.round(Math.abs(administered - scheduled) / (1000 * 60));
});

const isOutOfWindow = computed(() => timeDifferenceMinutes.value > 30);

// Función para extraer el UUID real del usuario logueado
const getRealUserId = () => {
  // 1. Si tu store ya guarda el ID en el objeto user
  if ((authStore as any).user?.id) return (authStore as any).user.id;
  if ((authStore as any).userId) return (authStore as any).userId;
  
  // 2. Si solo guardan el token, lo decodificamos a mano para sacar el "sub" (el UUID real en NestJS)
  const token = (authStore as any).token;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub; // 'sub' es donde el backend guarda el UUID
    } catch (e) {
      console.error('Error extrayendo ID del token', e);
    }
  }
  return ''; // Si llega acá, fallará el DTO con justicia porque no hay sesión real
};

const submitMedication = async () => {
  if (!props.patientId) return;

  // ---> FRENO DE SEGURIDAD FRONTEND <---
  // Si la diferencia supera los 30 min, bloqueamos el envío y mostramos error.
  if (isOutOfWindow.value) {
    toastRef.value?.show('Error: Fuera del margen de tolerancia (±30 min).', 'error');
    return; 
  }

  const realUserId = getRealUserId();
  
  if (!realUserId) {
    toastRef.value?.show('Error: No se pudo identificar al usuario en sesión.', 'error');
    return;
  }

  // Normalizamos el nombre del medicamento: quita espacios extra, pasa a minúscula y la primera a mayúscula
  const rawName = form.value.medicationName.trim().toLowerCase();
  const normalizedMedication = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  isSubmitting.value = true;
  try {
    await EhrNursingService.administerMedication({
      patientId: props.patientId,
      nurseId: realUserId, // Mandamos el UUID real extraído del Token/Store
      medicationName: normalizedMedication, // Usamos la variable normalizada
      dose: String(form.value.dose),
      quantity: Number(form.value.quantity),
      scheduledTime: new Date(form.value.scheduledTime),
      administeredTime: new Date(form.value.administeredTime)
    });

    toastRef.value?.show('Medicación registrada. El inventario se descontó automáticamente.', 'success');
    emit('medicationAdministered');

    form.value = {
      medicationName: '',
      dose: '',
      quantity: 1,
      scheduledTime: getCurrentDateTimeLocal(),
      administeredTime: getCurrentDateTimeLocal()
    };
  } catch (error: any) {
    const backendMsg = error.response?.data?.message || 'Error al registrar medicación.';
    toastRef.value?.show(backendMsg, 'error');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div :class="['medication-card', { 'window-alert': isOutOfWindow }]">
    <div class="card-header">
      <h3>Administración de Medicación</h3>
      <span :class="['badge', isOutOfWindow ? 'badge-danger' : 'badge-ok']">
        Diferencia: {{ timeDifferenceMinutes }} min (Tolerancia ±30m)
      </span>
    </div>

    <div v-if="isOutOfWindow" class="alert-warning">
      ⚠️ <strong>Fuera del margen horario (±30 min):</strong> Si intentás confirmar, se rechazará la aplicación por seguridad clínica.
    </div>

    <form @submit.prevent="submitMedication" class="med-form">
      <div class="form-row">
        <div class="input-group">
          <label>Medicamento (Insumo)</label>
          <input v-model="form.medicationName" type="text" placeholder="Ej: Paracetamol / Ibuprofeno" required />
        </div>
        <div class="input-group">
          <label>Dosis</label>
          <input v-model="form.dose" type="text" placeholder="Ej: 500mg" required />
        </div>
      </div>

      <div class="form-group">
         <label>Cantidad</label>
         <input type="number" v-model="form.quantity" min="1" class="form-control" />
      </div>

      <div class="form-row">
        <div class="input-group">
          <label>Hora Programada</label>
          <input v-model="form.scheduledTime" type="datetime-local" required />
        </div>
        <div class="input-group">
          <label>Hora Real de Administración</label>
          <input v-model="form.administeredTime" type="datetime-local" required />
        </div>
      </div>

      <button type="submit" :disabled="isSubmitting || isOutOfWindow" class="btn-submit">
        Confirmar Administración
      </button>
    </form>

    <ToastAlert ref="toastRef" />
  </div>
</template>

<style scoped>
.medication-card { padding: 20px; border-radius: 8px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-top: 20px; transition: 0.3s; }
.window-alert { border: 2px solid #e67e22; background: #fef9f3; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px; }
.card-header h3 { margin: 0; }
.badge { padding: 4px 10px; border-radius: 12px; font-size: 0.8em; font-weight: bold; }
.badge-ok { background: #e8f8f5; color: #0aa28a; }
.badge-danger { background: #fdebd0; color: #d35400; }
.alert-warning { background: #e67e22; color: white; padding: 10px; border-radius: 4px; font-size: 0.9em; margin-bottom: 15px; }
.med-form { display: flex; flex-direction: column; gap: 15px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.input-group { display: flex; flex-direction: column; }
label { font-size: 0.85em; font-weight: bold; color: #34495e; margin-bottom: 5px; }
input { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
.form-control { padding: 8px; border: 1px solid #ccc; border-radius: 4px; width: 100%; box-sizing: border-box; }
.form-group { margin-bottom: 15px; }
.btn-submit { padding: 10px 15px; background: #0aa28a; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; align-self: flex-start; }
.btn-submit:hover { background: #088a75; }
.btn-submit:disabled { background: #95a5a6; cursor: not-allowed; }
</style>