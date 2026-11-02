<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { AdmissionService } from '../services/admission.service';
import { useAuthStore } from '../../iam/store/auth.store';
import ToastAlert from '../../../shared/components/ToastAlert.vue';

const authStore = useAuthStore();
const agenda = ref<any[]>([]);
const isLoading = ref(true);
const toastRef = ref<InstanceType<typeof ToastAlert> | null>(null);
let refreshInterval: ReturnType<typeof setInterval>;

const showConfirmModal = ref(false);
const appointmentToComplete = ref('');

const timeZoneAR = 'America/Argentina/Buenos_Aires';

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

onMounted(() => {
  fetchAgenda();
  refreshInterval = setInterval(() => {
    fetchAgenda();
  }, 30000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

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
</script>

<template>
  <div class="doctor-agenda-container">
    <header class="agenda-header">
      <h1>Mi Agenda del Día</h1>
      <p class="subtitle">Dr/a. {{ authStore.userFullName }}</p>
    </header>

    <section class="panel">
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

.panel { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
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
.text-muted { color: #7f8c8d; font-style: italic; }
.empty-state { text-align: center; padding: 30px; color: #7f8c8d; font-style: italic; }
.loading-state { text-align: center; padding: 20px; color: #3498db; }

/* Estilos del Modal de Confirmación */
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