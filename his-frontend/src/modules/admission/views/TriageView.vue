<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { AdmissionService } from '../services/admission.service';
import ToastAlert from '../../../shared/components/ToastAlert.vue';

// --- Estados ---
const searchDni = ref('');
const patientDetails = ref<any>(null);
const patientIdToSubmit = ref('');
const isSearching = ref(false);

const doctors = ref<any[]>([]);
const selectedDoctorId = ref('');
const doctorAgenda = ref<any[]>([]);

const toastRef = ref<InstanceType<typeof ToastAlert> | null>(null);

const appointmentForm = ref({
  date: '',
  time: '',
  isOverbooking: false
});

const triageForm = ref({
  level: 3,
  symptoms: ''
});

// --- Inicialización ---
onMounted(async () => {
  try {
    const res = await AdmissionService.getAllDoctors();
    doctors.value = res.data.data;
  } catch (error) {
    console.error('Error al cargar médicos', error);
  }
});

// --- Funciones de Búsqueda y Agenda ---
const searchPatient = async () => {
  if (!searchDni.value) return;
  isSearching.value = true;
  try {
    const response = await AdmissionService.getPatientByDni(searchDni.value);
    patientDetails.value = response.data;
    patientIdToSubmit.value = response.data.id; 
  } catch (error) {
    toastRef.value?.show('Paciente no encontrado con ese DNI.', 'error');
    patientDetails.value = null;
    patientIdToSubmit.value = '';
  } finally {
    isSearching.value = false;
  }
};

const fetchDoctorAgenda = async () => {
  if (!selectedDoctorId.value) {
    doctorAgenda.value = [];
    return;
  }
  try {
    const res = await AdmissionService.getDoctorAgenda(selectedDoctorId.value);
    doctorAgenda.value = res.data.data;
  } catch (error) {
    console.error('Error al cargar agenda', error);
  }
};

// --- Manejo de Formularios ---
const handleBookAppointment = async () => {
  if (!patientIdToSubmit.value || !selectedDoctorId.value) {
    toastRef.value?.show('Debe seleccionar un paciente y un médico.', 'error');
    return;
  }
  
  // Combina fecha y hora en formato ISO 8601
  const localDate = new Date(`${appointmentForm.value.date}T${appointmentForm.value.time}`);
  const dateTimeString = localDate.toISOString();

  const payload = {
    doctorId: selectedDoctorId.value,
    patientId: patientIdToSubmit.value,
    startTime: dateTimeString
  };

  try {
    if (appointmentForm.value.isOverbooking) {
      await AdmissionService.insertEntreturno(payload);
      toastRef.value?.show('Entreturno insertado y agenda ajustada con éxito (HU 1.2)', 'success');
    } else {
      await AdmissionService.bookAppointment(payload);
      toastRef.value?.show('Turno programado reservado con éxito (HU 1.1)', 'success');
    }
    // Refrescar agenda y resetear formulario
    await fetchDoctorAgenda();
    appointmentForm.value = { date: '', time: '', isOverbooking: false };
  } catch (error: any) {
    toastRef.value?.show(error.response?.data?.message || 'Error al procesar el turno.', 'error');
  }
};

const handleAddTriage = async () => {
  if (!patientIdToSubmit.value) {
    toastRef.value?.show('Debe buscar y seleccionar un paciente primero.', 'error');
    return;
  }
  try {
    await AdmissionService.addToTriage({
      patientId: patientIdToSubmit.value,
      level: triageForm.value.level,
      symptoms: triageForm.value.symptoms
    });
    toastRef.value?.show('Paciente ingresado a Triaje de Urgencias (Estado: EN_ESPERA)', 'success');
    triageForm.value = { level: 3, symptoms: '' };
  } catch (error) {
    toastRef.value?.show('Error al registrar el paciente en triaje.', 'error');
  }
};
</script>

<template>
  <div class="triage-view-container">
    <h1 class="page-title">Admisión: Turnos, Entreturnos y Triaje</h1>

    <!-- 1. Identificar Paciente -->
    <section class="panel search-panel">
      <h2>1. Buscar Paciente</h2>
      <div class="search-bar">
        <div class="input-group">
          <label>DNI del Paciente:</label>
          <input v-model="searchDni" placeholder="Ingrese DNI" @keyup.enter="searchPatient" />
        </div>
        <button @click="searchPatient" class="btn-search" :disabled="isSearching">
          {{ isSearching ? 'Buscando...' : 'Buscar' }}
        </button>
      </div>
      <div v-if="patientDetails" class="success-alert">
        <strong>Paciente Seleccionado:</strong> {{ patientDetails.firstName }} {{ patientDetails.lastName }}
      </div>
    </section>

    <div class="forms-grid" :class="{ 'disabled-grid': !patientDetails }">
      
      <!-- 2A. Turnos y Entreturnos -->
      <section class="panel">
        <h2>2A. Asignar Turno / Entreturno</h2>
        
        <div class="input-group">
          <label>Seleccionar Médico:</label>
          <select v-model="selectedDoctorId" @change="fetchDoctorAgenda" :disabled="!patientDetails">
            <option value="">-- Elija un profesional --</option>
            <option v-for="doc in doctors" :key="doc.id" :value="doc.userId">
              Dr/a. {{ doc.user.fullName }} - {{ doc.specialty }}
            </option>
          </select>
        </div>

        <div v-if="selectedDoctorId" class="agenda-container">
          <h3>Agenda del Día</h3>
          <table class="agenda-table">
            <thead>
              <tr>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Estado</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="apt in doctorAgenda" :key="apt.id" :class="{'entreturno-row': apt.isOverbooking}">
                <td>{{ new Date(apt.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</td>
                <td>{{ apt.endTime ? new Date(apt.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--' }}</td>
                <td>{{ apt.status }}</td>
                <td>
                  <span v-if="apt.isOverbooking" class="badge-warning">Entreturno</span>
                  <span v-else class="badge-normal">Normal</span>
                </td>
              </tr>
              <tr v-if="doctorAgenda.length === 0">
                <td colspan="4">Sin turnos agendados.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <form v-if="selectedDoctorId" @submit.prevent="handleBookAppointment" class="form-container mt-3">
          <div style="display: flex; gap: 10px;">
            <div class="input-group" style="flex: 1;">
              <label>Fecha:</label>
              <input type="date" v-model="appointmentForm.date" required />
            </div>
            <div class="input-group" style="flex: 1;">
              <label>Hora:</label>
              <input type="time" v-model="appointmentForm.time" required />
            </div>
          </div>
          
          <div class="input-group checkbox-group">
            <input type="checkbox" id="overbooking" v-model="appointmentForm.isOverbooking" />
            <label for="overbooking" class="text-warning">Marcar como Entreturno (Reduce turno previo)</label>
          </div>
          
          <button type="submit" :class="appointmentForm.isOverbooking ? 'btn-warning' : 'btn-primary'">
            {{ appointmentForm.isOverbooking ? 'Insertar Entreturno' : 'Reservar Turno' }}
          </button>
        </form>
      </section>

      <!-- 2B. Triaje (Guardia) -->
      <section class="panel triage-panel">
        <h2>2B. Ingreso a Guardia (Triaje)</h2>
        <form @submit.prevent="handleAddTriage" class="form-container">
          <div class="input-group">
            <label>Síntomas principales:</label>
            <input v-model="triageForm.symptoms" placeholder="Ej: Dolor agudo" required :disabled="!patientDetails" />
          </div>
          <div class="input-group">
            <label>Nivel de Urgencia:</label>
            <select v-model="triageForm.level" :disabled="!patientDetails">
              <option :value="1">ROJO (1) - Riesgo de vida inmediato</option>
              <option :value="2">AMARILLO (2) - Urgencia mayor</option>
              <option :value="3">VERDE (3) - Urgencia menor</option>
            </select>
          </div>
          <button type="submit" class="btn-danger" :disabled="!patientDetails">
            Registrar Ingreso a Guardia
          </button>
        </form>
      </section>
    </div>

    <!-- Componente de Notificación -->
    <ToastAlert ref="toastRef" />
  </div>
</template>

<style scoped>
.triage-view-container { max-width: 1100px; margin: 0 auto; }
.page-title { margin-bottom: 20px; color: #2c3e50; }
.panel { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; }
.search-panel { border-left: 5px solid #3498db; }
.triage-panel { border-top: 5px solid #e74c3c; }

.search-bar { display: flex; align-items: flex-end; gap: 15px; margin-bottom: 15px; }
.search-bar .input-group { flex: 1; margin-bottom: 0; }

.forms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; transition: opacity 0.3s; }
.disabled-grid { opacity: 0.5; pointer-events: none; }

.input-group { margin-bottom: 15px; }
label { display: block; font-weight: bold; margin-bottom: 5px; color: #34495e; font-size: 0.9em; }
input, select { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
.checkbox-group { display: flex; align-items: center; gap: 10px; }
.checkbox-group input { width: auto; transform: scale(1.2); cursor: pointer; }
.text-warning { color: #d35400; }

button { padding: 12px; font-weight: bold; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%; }
button:disabled { background-color: #bdc3c7 !important; cursor: not-allowed; }
.btn-search { background: #2c3e50; width: auto; padding: 0 20px; height: 40px; }
.btn-primary { background: #3498db; }
.btn-warning { background: #f39c12; }
.btn-danger { background: #e74c3c; }

.success-alert { padding: 12px; background-color: #d4edda; color: #155724; border-left: 5px solid #28a745; margin-top: 10px; }
.mt-3 { margin-top: 15px; }

/* Tabla de Agenda */
.agenda-container { margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 6px; border: 1px solid #e9ecef; max-height: 250px; overflow-y: auto; }
.agenda-container h3 { margin-top: 0; font-size: 1rem; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
.agenda-table { width: 100%; border-collapse: collapse; font-size: 0.9em; }
.agenda-table th, .agenda-table td { padding: 6px; border-bottom: 1px solid #ddd; text-align: left; }
.entreturno-row { background-color: #fff3cd; }
.badge-warning { background: #ffc107; color: #000; padding: 3px 8px; border-radius: 12px; font-weight: bold; font-size: 0.8em; }
.badge-normal { background: #28a745; color: #fff; padding: 3px 8px; border-radius: 12px; font-size: 0.8em; }
</style>