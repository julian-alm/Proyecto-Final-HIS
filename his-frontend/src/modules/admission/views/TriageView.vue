<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { AdmissionService } from '../services/admission.service';
import ToastAlert from '../../../shared/components/ToastAlert.vue';

const searchDni = ref('');
const patientDetails = ref<any>(null);
const patientIdToSubmit = ref('');
const isSearching = ref(false);

const doctors = ref<any[]>([]);
const selectedDoctorId = ref('');
const doctorAgenda = ref<any[]>([]);

const toastRef = ref<InstanceType<typeof ToastAlert> | null>(null);
let refreshInterval: ReturnType<typeof setInterval>;

const showCancelModal = ref(false);
const appointmentToCancel = ref('');

const appointmentForm = ref({
  date: '',
  time: '',
  isOverbooking: false
});

const triageForm = ref({
  level: 3,
  symptoms: ''
});

const timeZoneAR = 'America/Argentina/Buenos_Aires';

onMounted(async () => {
  try {
    const res = await AdmissionService.getAllDoctors();
    doctors.value = res.data.data;
  } catch (error) {
    console.error('Error al cargar médicos', error);
  }

  refreshInterval = setInterval(() => {
    if (selectedDoctorId.value) {
      fetchDoctorAgenda();
    }
  }, 30000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

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

const selectedDoctorInfo = computed(() => {
  const doc = doctors.value.find(d => d.userId === selectedDoctorId.value);
  return doc ? `${doc.user.fullName} (${doc.specialty})` : 'Médico no encontrado';
});

const handleBookAppointment = async () => {
  if (!patientIdToSubmit.value || !selectedDoctorId.value) {
    toastRef.value?.show('Debe seleccionar un paciente y un médico.', 'error');
    return;
  }
  
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
      toastRef.value?.show('Entreturno insertado y agenda ajustada con éxito', 'success');
    } else {
      await AdmissionService.bookAppointment(payload);
      toastRef.value?.show('Turno programado reservado con éxito', 'success');
    }
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
    toastRef.value?.show('Paciente ingresado a Triaje de Urgencias', 'success');
    triageForm.value = { level: 3, symptoms: '' };
  } catch (error) {
    toastRef.value?.show('Error al registrar el paciente en triaje.', 'error');
  }
};

const handleMoveToWaitingRoom = async (appointmentId: string) => {
  try {
    await AdmissionService.moveToWaitingRoom(appointmentId);
    toastRef.value?.show('El paciente fue pasado a Sala de Espera', 'success');
    await fetchDoctorAgenda();
  } catch (error) {
    toastRef.value?.show('Error al actualizar el estado del turno.', 'error');
  }
};

const promptCancelAppointment = (appointmentId: string) => {
  appointmentToCancel.value = appointmentId;
  showCancelModal.value = true;
};

const closeCancelModal = () => {
  showCancelModal.value = false;
  appointmentToCancel.value = '';
};

const confirmCancelAppointment = async () => {
  if (!appointmentToCancel.value) return;
  
  try {
    await AdmissionService.cancelAppointment(appointmentToCancel.value);
    toastRef.value?.show('El turno ha sido cancelado exitosamente', 'success');
    await fetchDoctorAgenda();
  } catch (error) {
    toastRef.value?.show('Error al cancelar el turno.', 'error');
  } finally {
    closeCancelModal();
  }
};

const formatTime = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('es-AR', { 
    timeZone: timeZoneAR, 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};
</script>

<template>
  <div class="triage-view-container">
    <h1 class="page-title">Admisión: Turnos, Entreturnos y Triaje</h1>

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

    <section v-if="selectedDoctorId" class="panel agenda-full-panel mt-3">
      <h3>Agenda Completa del Día</h3>
      <div class="agenda-table-wrapper">
        <table class="agenda-table">
          <thead>
            <tr>
              <th>Médico</th>
              <th>Paciente</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Estado</th>
              <th>Tipo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="apt in doctorAgenda" :key="apt.id" :class="{'entreturno-row': apt.isOverbooking, 'canceled-row': apt.status === 'CANCELADO'}">
              <td>{{ selectedDoctorInfo }}</td>
              <td>{{ apt.patientFullName || 'Desconocido' }}</td>
              <td>{{ formatTime(apt.startTime) }}</td>
              <td>{{ apt.endTime ? formatTime(apt.endTime) : '--:--' }}</td>
              <td>
                <span :class="`status-badge status-${apt.status.toLowerCase()}`">{{ apt.status }}</span>
              </td>
              <td>
                <span v-if="apt.isOverbooking" class="badge-warning">Entreturno</span>
                <span v-else class="badge-normal">Normal</span>
              </td>
              <td class="actions-cell">
                <template v-if="apt.status === 'RESERVADO'">
                  <button @click="handleMoveToWaitingRoom(apt.id)" class="btn-sm btn-info" title="Pasar a Sala de Espera">
                    A Sala
                  </button>
                  <button @click="promptCancelAppointment(apt.id)" class="btn-sm btn-danger-outline" title="Cancelar Turno">
                    Cancelar
                  </button>
                </template>
                <span v-else-if="apt.status === 'CANCELADO'" class="text-muted">Cancelado</span>
                <span v-else class="text-muted">En proceso</span>
              </td>
            </tr>
            <tr v-if="doctorAgenda.length === 0">
              <td colspan="7" class="empty-state">Sin turnos agendados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Transition name="fade">
      <div v-if="showCancelModal" class="modal-overlay">
        <div class="modal-content">
          <h3>¿Cancelar Turno?</h3>
          <p>Esta acción cambiará el estado del turno a "CANCELADO" y no se podrá revertir. El horario quedará marcado como cancelado en la agenda.</p>
          <div class="modal-actions">
            <button @click="closeCancelModal" class="btn-cancel">Atrás</button>
            <button @click="confirmCancelAppointment" class="btn-confirm">Sí, cancelar turno</button>
          </div>
        </div>
      </div>
    </Transition>

    <ToastAlert ref="toastRef" />
  </div>
</template>

<style scoped>
.triage-view-container { max-width: 1100px; margin: 0 auto; }
.page-title { margin-bottom: 20px; color: #2c3e50; }
.panel { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; }
.search-panel { border-left: 5px solid #3498db; }
.triage-panel { border-top: 5px solid #e74c3c; }
.agenda-full-panel { border-top: 5px solid #9b59b6; }

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

.btn-sm { padding: 6px 10px; font-size: 0.85em; width: auto; margin-right: 5px; border-radius: 4px; }
.btn-info { background: #17a2b8; color: white; }
.btn-info:hover { background: #138496; }
.btn-danger-outline { background: transparent; color: #dc3545; border: 1px solid #dc3545; }
.btn-danger-outline:hover { background: #dc3545; color: white; }

.success-alert { padding: 12px; background-color: #d4edda; color: #155724; border-left: 5px solid #28a745; margin-top: 10px; }
.mt-3 { margin-top: 15px; }
.text-muted { color: #6c757d; font-size: 0.9em; font-style: italic; }
.empty-state { text-align: center; padding: 20px; color: #7f8c8d; font-style: italic; }

.agenda-table-wrapper { overflow-x: auto; margin-top: 15px; }
.agenda-table { width: 100%; border-collapse: collapse; font-size: 0.95em; }
.agenda-table th { background-color: #f8f9fa; padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6; color: #495057; }
.agenda-table td { padding: 10px; border-bottom: 1px solid #e9ecef; vertical-align: middle; }
.entreturno-row { background-color: #fff3cd; }
.canceled-row { opacity: 0.6; background-color: #f8f9fa; }

.actions-cell { display: flex; gap: 5px; align-items: center; }

.badge-warning { background: #ffc107; color: #000; padding: 4px 8px; border-radius: 12px; font-weight: bold; font-size: 0.8em; }
.badge-normal { background: #28a745; color: #fff; padding: 4px 8px; border-radius: 12px; font-size: 0.8em; }

.status-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.85em; font-weight: bold; }
.status-reservado { background: #e1f5fe; color: #0277bd; }
.status-en_sala_de_espera { background: #fff3e0; color: #e65100; }
.status-en_consultorio { background: #e8f4f8; color: #2980b9; }
.status-atendido { background: #e8f5e9; color: #2e7d32; }
.status-cancelado { background: #ffebee; color: #c62828; text-decoration: line-through; }

/* Modal Styles */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: white; padding: 25px; border-radius: 8px; max-width: 400px; width: 90%; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); text-align: center; }
.modal-content h3 { margin-top: 0; color: #2c3e50; }
.modal-content p { color: #7f8c8d; margin-bottom: 25px; font-size: 0.95em; line-height: 1.4; }
.modal-actions { display: flex; justify-content: space-between; gap: 15px; }
.btn-cancel { flex: 1; padding: 10px; border: 1px solid #bdc3c7; background: transparent; border-radius: 4px; color: #7f8c8d; font-weight: bold; cursor: pointer; transition: 0.2s; }
.btn-cancel:hover { background: #f8f9fa; color: #34495e; }
.btn-confirm { flex: 1; padding: 10px; border: none; background: #e74c3c; border-radius: 4px; color: white; font-weight: bold; cursor: pointer; transition: 0.2s; }
.btn-confirm:hover { background: #c0392b; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>