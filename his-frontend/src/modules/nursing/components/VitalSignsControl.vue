<script setup lang="ts">
import { ref, computed } from 'vue';
import { EhrNursingService } from '../services/ehr-nursing.service';
import ToastAlert from '../../../shared/components/ToastAlert.vue';

const props = defineProps<{ patientId: string }>();
const emit = defineEmits(['vitalSignsRecorded']);

const form = ref({
  temperature: 36.5,
  bloodPressure: '120/80',
  heartRate: 75
});

const isSubmitting = ref(false);
const toastRef = ref<InstanceType<typeof ToastAlert> | null>(null);

// Corregido: Detecta fiebre alta si es mayor o igual a 39°C
const hasHighFever = computed(() => Number(form.value.temperature) >= 39.0);

const submitVitalSigns = async () => {
  if (!props.patientId) return;
  isSubmitting.value = true;
  
  try {
    await EhrNursingService.recordVitalSigns({
      patientId: props.patientId,
      temperature: Number(form.value.temperature),
      bloodPressure: form.value.bloodPressure,
      heartRate: Number(form.value.heartRate)
    });
    
    if (hasHighFever.value) {
      toastRef.value?.show('ALERTA: Temperatura >= 39°C. Médico de guardia notificado.', 'error');
    } else {
      toastRef.value?.show('Signos vitales registrados con éxito.', 'success');
    }
    
emit('vitalSignsRecorded');
    
    // Reseteamos los valores a vacíos o ceros para una nueva carga limpia
    form.value = {
      temperature: 0,
      bloodPressure: '',
      heartRate: 0
    };
  } catch (error) {
    toastRef.value?.show('Error al registrar signos vitales.', 'error');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div :class="['vital-signs-card', { 'fever-alert': hasHighFever }]">
    <h3>Control de Signos Vitales</h3>
    <div v-if="hasHighFever" class="alert-banner">
      ⚠️ ALERTA: Fiebre alta detectada (>39°C). Notificación de alta prioridad activa.
    </div>
    
    <form @submit.prevent="submitVitalSigns" class="vital-form">
      <div class="input-group">
        <label>Temperatura (°C)</label>
        <input v-model="form.temperature" type="number" step="0.1" min="34" max="42" required />
      </div>
      <div class="input-group">
        <label>Presión Arterial</label>
        <input v-model="form.bloodPressure" type="text" placeholder="Ej: 120/80" required />
      </div>
      <div class="input-group">
        <label>Frec. Cardíaca (lpm)</label>
        <input v-model="form.heartRate" type="number" required />
      </div>
      <button type="submit" :disabled="isSubmitting" class="btn-submit">
        Registrar Controles
      </button>
    </form>
    <ToastAlert ref="toastRef" />
  </div>
</template>

<style scoped>
.vital-signs-card { padding: 20px; border-radius: 8px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: 0.3s; margin-top: 20px; }
.fever-alert { border: 2px solid #e74c3c; background: #fff5f5; }
.alert-banner { background: #e74c3c; color: white; padding: 10px; border-radius: 4px; font-weight: bold; margin-bottom: 15px; font-size: 0.9em; }
.vital-form { display: flex; gap: 15px; align-items: flex-end; flex-wrap: wrap; }
.input-group { display: flex; flex-direction: column; flex: 1; min-width: 120px; }
label { font-size: 0.85em; font-weight: bold; color: #34495e; margin-bottom: 5px; }
input { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
.btn-submit { padding: 10px 15px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; height: 38px; }
.btn-submit:hover { background: #2980b9; }
</style>