<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { AdmissionService } from '../services/admission.service';
import { useAuthStore } from '../../iam/store/auth.store';
import ToastAlert from '../../../shared/components/ToastAlert.vue'; // Ajusta la ruta

const authStore = useAuthStore();
const agenda = ref<any[]>([]);
const isLoading = ref(true);
const toastRef = ref<InstanceType<typeof ToastAlert> | null>(null);

const fetchAgenda = async () => {
    const doctorId = authStore.userId;
    if (!doctorId) return;

    try {
        const res = await AdmissionService.getDoctorAgenda(doctorId);
        agenda.value = res.data.data;
    } catch (error) {
        console.error('Error al cargar la agenda', error);
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    fetchAgenda();
});

const handleCompleteAttention = async (appointmentId: string) => {
    try {
        await AdmissionService.completeAppointment(appointmentId);
        toastRef.value?.show('Consulta finalizada. Turno marcado como ATENDIDO.', 'success');
        await fetchAgenda(); 
    } catch (error) {
        toastRef.value?.show('Error al actualizar el estado del turno.', 'error');
    }
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
                    <tr v-for="apt in agenda" :key="apt.id" :class="{'entreturno-row': apt.isOverbooking}">
                        <td class="time-col">
                            <strong>{{ new Date(apt.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</strong>
                            <span v-if="apt.endTime"> - {{ new Date(apt.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
                            <span v-if="apt.isOverbooking" class="badge-warning ml-2">Entreturno</span>
                        </td>

                        <td>{{ apt.patientFullName || 'Desconocido' }}</td>

                        <td class="actions-col">
                            <button 
                                v-if="apt.status === 'RESERVADO' || apt.status === 'EN_SALA_DE_ESPERA'" 
                                @click="handleCompleteAttention(apt.id)" 
                                class="btn-action"
                            >
                                Finalizar Consulta (Atendido)
                            </button>
                            <span v-else class="status-badge">{{ apt.status }}</span>
                        </td>
                    </tr>
                    <tr v-if="agenda.length === 0">
                        <td colspan="3" class="empty-state">No tienes turnos agendados para hoy.</td>
                    </tr>
                </tbody>
            </table>
        </section>

        <!-- Componente de Notificación -->
        <ToastAlert ref="toastRef" />
    </div>
</template>

<style scoped>
/* Mantén exactamente tus mismos estilos aquí, no cambian */
.doctor-agenda-container { padding: 20px; }
.agenda-header { margin-bottom: 20px; }
.agenda-header h1 { color: #2c3e50; margin-bottom: 5px; }
.subtitle { color: #7f8c8d; font-size: 1.1em; margin-top: 0; }
.panel { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.agenda-table { width: 100%; border-collapse: collapse; }
.agenda-table th { background-color: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; color: #34495e; }
.agenda-table td { padding: 12px; border-bottom: 1px solid #eee; vertical-align: middle; }
.entreturno-row { background-color: #fffaf0; }
.time-col { min-width: 150px; }
.ml-2 { margin-left: 8px; }
.badge-warning { background: #f39c12; color: #fff; padding: 2px 6px; border-radius: 8px; font-size: 0.75em; font-weight: bold; }
.status-badge { background: #e8f5e9; color: #2e7d32; padding: 6px 12px; border-radius: 4px; font-size: 0.85em; font-weight: bold; }
.btn-action { background: #0aa28a; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; transition: 0.2s; }
.btn-action:hover { background: #08836f; }
.empty-state { text-align: center; padding: 30px; color: #7f8c8d; font-style: italic; }
.loading-state { text-align: center; padding: 20px; color: #3498db; }
</style>