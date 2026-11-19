<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { AdmissionService } from '../services/admission.service';
import { useAuthStore } from '../../iam/store/auth.store';
import ToastAlert from '../../../shared/components/ToastAlert.vue';

const authStore = useAuthStore();
const router = useRouter();

const agenda = ref<any[]>([]);
const assignedPatients = ref<any[]>([]);
const triageQueue = ref<any[]>([]);
const isLoading = ref(true);
const isLoadingPatients = ref(true);
const toastRef = ref<InstanceType<typeof ToastAlert> | null>(null);
let refreshInterval: ReturnType<typeof setInterval>;

const showConfirmModal = ref(false);
const appointmentToComplete = ref('');

const timeZoneAR = 'America/Argentina/Buenos_Aires';

// Si es DOCTOR, filtra la cola para ver SOLO a sus pacientes asignados (ADMIN ve todos)
const filteredTriageQueue = computed(() => {
  const role = (authStore as any).userRole || (authStore as any).role || (authStore as any).user?.role;
  if (role === 'ADMIN') return triageQueue.value;

  return triageQueue.value.filter((entry: any) =>
    assignedPatients.value.some(
      (p: any) =>
        String(p.dni) === String(entry.patientDni) ||
        (p.id && String(p.id) === String(entry.patientId))
    )
  );
});

// Detecta si hay algún paciente en Riesgo Vital (Código Rojo = 1) entre SUS pacientes
const codeRedPatients = computed(() =>
  filteredTriageQueue.value.filter((entry: any) => Number(entry.level) === 1)
);

const fetchAgenda = async () => {
  const doctorId = authStore.userId;
  if (!doctorId) return;

  try {
    const res = await AdmissionService.getDoctorAgenda(doctorId);
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: timeZoneAR });
    
    agenda.value = res.data.data.filter((apt: any) => {
      const aptDateStr = new Date(apt.startTime).toLocaleDateString('en-CA', { timeZone: timeZoneAR });
      return aptDateStr === todayStr && 
      ['EN_SALA_DE_ESPERA', 'EN_CONSULTORIO', 'ATENDIDO'].includes(apt.status);
    });
  } catch (error) {
    console.error('Error al cargar la agenda', error);
  } finally {
    isLoading.value = false;
  }
};

const fetchTriageQueue = async () => {
  try {
    const res = await AdmissionService.getTriageQueue();
    const data = res?.data ?? res;
    triageQueue.value = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error al cargar la cola de triaje', error);
  }
};

const fetchAssignedPatients = async () => {
  try {
    const response = await AdmissionService.getAssignedPatients();
    const resultado = response.data || response;
    assignedPatients.value = resultado.data || resultado;
  } catch (error) {
    console.error('Error al cargar pacientes vinculados', error);
  } finally {
    isLoadingPatients.value = false;
  }
};

onMounted(() => {
  fetchAgenda();
  fetchTriageQueue();
  fetchAssignedPatients();
  refreshInterval = setInterval(() => {
    fetchAgenda();
    fetchTriageQueue();
  }, 5000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

const handleAttendTriage = async (triageId: string) => {
  try {
    await AdmissionService.attendTriagePatient(triageId);
    toastRef.value?.show('Paciente de guardia tomado para atención.', 'success');
    await fetchTriageQueue();
  } catch (error) {
    toastRef.value?.show('Error al tomar el paciente de guardia.', 'error');
  }
};

const getTriageBadge = (level: number) => {
  if (level === 1) return { label: 'ROJO - Riesgo Vital', class: 'triage-red' };
  if (level === 2) return { label: 'AMARILLO - Urgente', class: 'triage-yellow' };
  return { label: 'VERDE - Menor', class: 'triage-green' };
};

const handleCallPatient = async (appointmentId: string) => {
  try {
    await AdmissionService.moveToConsultingRoom(appointmentId);
    toastRef.value?.show('Paciente llamado. Turno en CONSULTORIO.', 'success');
    await fetchAgenda();
  } catch (error) {
    toastRef.value?.show('Error al llamar al paciente.', 'error');
  }
};

const promptCompleteAttention = (appointmentId: string) => {
  appointmentToComplete.value = appointmentId;
  showConfirmModal.value = true;
};

const cancelCompleteAttention = () => {
  showConfirmModal.value = false;
  appointmentToComplete.value = '';
};

const confirmCompleteAttention = async () => {
  if (!appointmentToComplete.value) return;
  
  try {
    await AdmissionService.completeAppointment(appointmentToComplete.value);
    toastRef.value?.show('Consulta finalizada correctamente.', 'success');
    await fetchAgenda();
  } catch (error) {
    toastRef.value?.show('Error al finalizar el turno.', 'error');
  } finally {
    showConfirmModal.value = false;
    appointmentToComplete.value = '';
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

const goToHCE = (dni: string) => {
  router.push(`/hce/${dni}`);
};
</script>

<template>
  <div class="doctor-agenda-container">
    <header class="agenda-header">
      <h1>Mi Panel de Control</h1>
      <p class="subtitle">Dr/a. {{ authStore.userFullName }}</p>
    </header>

    <!-- ALERTA DESTACADA CÓDIGO ROJO (HU 3.1) -->
    <div v-if="codeRedPatients.length > 0" class="code-red-banner mb-4">
      <div class="code-red-header">
        <strong>🚨 ALERTA CÓDIGO ROJO - RIESGO VITAL EN GUARDIA ({{ codeRedPatients.length }})</strong>
      </div>
      <div v-for="urgent in codeRedPatients" :key="urgent.id" class="code-red-item">
        <div>
          <strong>{{ urgent.patientName }}</strong> (DNI: {{ urgent.patientDni }}) —
          <span>Síntomas: {{ urgent.symptoms }}</span>
          <small class="ml-2">({{ formatTime(urgent.arrivalTime) }})</small>
        </div>
        <button @click="handleAttendTriage(urgent.id)" class="btn-action btn-urgent">
          Atender Urgencia Ya
        </button>
      </div>
    </div>

    <!-- COLA DE GUARDIA / TRIAJE ORDENADA POR PRIORIDAD -->
    <section class="panel mb-4">
      <h2>Cola de Guardia (Triaje)</h2>
      <table class="agenda-table">
        <thead>
          <tr>
            <th>Prioridad</th>
            <th>Llegada</th>
            <th>Paciente</th>
            <th>Síntomas</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="entry in filteredTriageQueue"
            :key="entry.id"
            :class="{ 'row-code-red': entry.level === 1 }"
          >
            <td>
              <span :class="['triage-badge', getTriageBadge(entry.level).class]">
                {{ getTriageBadge(entry.level).label }}
              </span>
            </td>
            <td>{{ formatTime(entry.arrivalTime) }}</td>
            <td>
              <strong>{{ entry.patientName }}</strong>
              <div class="text-muted" style="font-size: 0.85em;">DNI: {{ entry.patientDni }}</div>
            </td>
            <td>{{ entry.symptoms }}</td>
            <td>
              <button @click="handleAttendTriage(entry.id)" class="btn-action btn-call">
                Atender
              </button>
            </td>
          </tr>
          <tr v-if="filteredTriageQueue.length === 0">
            <td colspan="5" class="empty-state">No hay pacientes en espera en la guardia.</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="panel mb-4">
      <h2>Turnos de Hoy</h2>
      <div v-if="isLoading" class="loading-state">Cargando turnos...</div>
      
      <table v-else class="agenda-table">
        <thead>
          <tr>
            <th>Horario</th>
            <th>Nombre completo del paciente</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="apt in agenda" :key="apt.id" 
              :class="[
                {'entreturno-row': apt.isOverbooking},
                `row-status-${apt.status.toLowerCase()}`
              ]">
            <td class="time-col">
              <strong>{{ formatTime(apt.startTime) }}</strong>
              <span v-if="apt.endTime"> - {{ formatTime(apt.endTime) }}</span>
              <span v-if="apt.isOverbooking" class="badge-warning ml-2">Entreturno</span>
            </td>
            
            <td>{{ apt.patientFullName || 'Desconocido' }}</td>
            
            <td class="actions-col">
              <button 
                v-if="apt.status === 'EN_SALA_DE_ESPERA'" 
                @click="handleCallPatient(apt.id)" 
                class="btn-action btn-call"
              >
                Llamar (A Consultorio)
              </button>

              <button 
                v-if="apt.status === 'EN_CONSULTORIO'" 
                @click="promptCompleteAttention(apt.id)" 
                class="btn-action btn-finish"
              >
                Finalizar Consulta
              </button>
              
              <span v-if="apt.status === 'ATENDIDO'" class="text-muted">
                <strong>Completado</strong>
              </span>
            </td>
          </tr>
          <tr v-if="agenda.length === 0">
            <td colspan="3" class="empty-state">No tienes pacientes agendados para hoy en esta vista.</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="panel">
      <h2>Mis Pacientes Asignados</h2>
      <p class="text-muted" style="margin-bottom: 15px;">Listado de pacientes vinculados para acceso a Historia Clínica.</p>
      
      <div v-if="isLoadingPatients" class="loading-state">Cargando pacientes...</div>
      
      <table v-else class="agenda-table">
        <thead>
          <tr>
            <th>DNI / Identificación</th>
          </tr>
        </thead>
       <tbody>
          <tr v-for="paciente in assignedPatients" :key="paciente.dni">
            <td><strong>{{ paciente.dni }} - {{ paciente.lastName }}, {{ paciente.firstName }}</strong></td>
          </tr>
          <tr v-if="assignedPatients.length === 0">
            <td class="empty-state">No tienes pacientes asignados por el momento.</td>
          </tr>
        </tbody>
      </table>
    </section>

    <Transition name="fade">
      <div v-if="showConfirmModal" class="modal-overlay">
        <div class="modal-content">
          <h3>¿Finalizar Consulta?</h3>
          <p>Una vez marcada como "ATENDIDO", esta acción no se podrá deshacer y no podrá volver a cambiar el estado del turno.</p>
          <div class="modal-actions">
            <button @click="cancelCompleteAttention" class="btn-cancel">Cancelar</button>
            <button @click="confirmCompleteAttention" class="btn-confirm">Sí, finalizar</button>
          </div>
        </div>
      </div>
    </Transition>

    <ToastAlert ref="toastRef" />
  </div>
</template>

<style scoped>
.doctor-agenda-container { padding: 20px; max-width: 1000px; margin: 0 auto; }
.agenda-header { margin-bottom: 20px; }
.agenda-header h1 { color: #2c3e50; margin-bottom: 5px; }
.subtitle { color: #7f8c8d; font-size: 1.1em; margin-top: 0; }
.mb-4 { margin-bottom: 30px; }

.code-red-banner {
  background: #c0392b;
  color: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  border: 2px solid #922b21;
  box-shadow: 0 4px 12px rgba(192, 57, 43, 0.35);
  animation: pulse-red 2s infinite;
}
.code-red-header { font-size: 1.05rem; margin-bottom: 10px; }
.code-red-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.18);
  padding: 10px 14px;
  border-radius: 6px;
  margin-top: 8px;
}
.btn-urgent { background: #fff; color: #c0392b !important; }
.btn-urgent:hover { background: #f9ebea; }

@keyframes pulse-red {
  0%, 100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.6); }
  50% { box-shadow: 0 0 0 10px rgba(231, 76, 60, 0); }
}

.row-code-red { background-color: #fdedec; border-left: 5px solid #e74c3c; }
.triage-badge { padding: 4px 10px; border-radius: 12px; font-size: 0.78em; font-weight: bold; display: inline-block; }
.triage-red { background: #e74c3c; color: #fff; }
.triage-yellow { background: #f39c12; color: #fff; }
.triage-green { background: #27ae60; color: #fff; }

.panel { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.panel h2 { margin-top: 0; color: #2c3e50; font-size: 1.3rem; margin-bottom: 15px; }

.agenda-table { width: 100%; border-collapse: collapse; }
.agenda-table th { background-color: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; color: #34495e; }
.agenda-table td { padding: 12px; border-bottom: 1px solid #eee; vertical-align: middle; transition: background-color 0.3s; }

.entreturno-row { background-color: #fffaf0; }
.row-status-en_consultorio { background-color: #e8f4f8 !important; border-left: 5px solid #3498db; }
.row-status-atendido { background-color: #f8f9fa !important; opacity: 0.7; pointer-events: none; border-left: 5px solid #95a5a6; }

.time-col { min-width: 150px; }
.ml-2 { margin-left: 8px; }
.badge-warning { background: #f39c12; color: #fff; padding: 2px 6px; border-radius: 8px; font-size: 0.75em; font-weight: bold; }

.btn-action { color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; transition: 0.2s; }
.btn-call { background: #3498db; }
.btn-call:hover { background: #2980b9; }
.btn-finish { background: #0aa28a; }
.btn-finish:hover { background: #08836f; }
.btn-hce { background: #2c3e50; }
.btn-hce:hover { background: #1a252f; }

.text-muted { color: #7f8c8d; font-style: italic; }
.empty-state { text-align: center; padding: 30px; color: #7f8c8d; font-style: italic; }
.loading-state { text-align: center; padding: 20px; color: #3498db; }

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