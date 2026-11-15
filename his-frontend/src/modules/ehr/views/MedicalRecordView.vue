<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router'; 
import { EhrNursingService } from '../../nursing/services/ehr-nursing.service';
import { AdmissionService } from '../../admission/services/admission.service';
import { useAuthStore } from '../../iam/store/auth.store';
import ToastAlert from '../../../shared/components/ToastAlert.vue';

const route = useRoute();
const authStore = useAuthStore();

const dniInput = ref('');
const currentPatient = ref<any>(null);
const medicalRecord = ref<any>(null);
const newProgressNote = ref('');

const isSearching = ref(false);
const isSubmitting = ref(false);
const toastRef = ref<InstanceType<typeof ToastAlert> | null>(null);

onMounted(async () => {
  if (authStore.userRole === 'PATIENT') {
    const patientDniMapping: Record<string, string> = {
      'Ana Rojas': '35123456',
      'Carlos Gómez': '11223344',
      'Carlos Gomez': '11223344'
    };

    const userName = (authStore as any).userFullName || '';
    const userDni = patientDniMapping[userName];

    if (userDni) {
      dniInput.value = userDni;
      await searchByDniAndLoadHce(); 
      dniInput.value = '';
    } else {
      toastRef.value?.show('Error: Cuenta de paciente no enlazada al legajo clínico.', 'error');
    }
  } else {
    // 👇 AUTO-CARGA: Si venimos desde el botón de la agenda, leemos el DNI de la URL
    const urlDni = route.params.dni as string;
    if (urlDni) {
      dniInput.value = urlDni;
      await searchByDniAndLoadHce();
    }
  }
});

const searchByDniAndLoadHce = async () => {
  if (!dniInput.value.trim()) return;
  isSearching.value = true;

  try {
    // 🔒 CANDADO DE SEGURIDAD PARA MÉDICOS
    if (authStore.userRole === 'DOCTOR') {
      const assignedRes = await AdmissionService.getAssignedPatients();
      const assigned = assignedRes.data?.data || assignedRes.data || [];
      
      // Verificamos si el DNI que intentan buscar está en su lista de asignados
      const isAssigned = assigned.some((p: any) => p.dni === dniInput.value.trim());
      
      if (!isAssigned) {
        toastRef.value?.show('Acceso Denegado: Este paciente no está en tu lista de asignados.', 'error');
        currentPatient.value = null;
        medicalRecord.value = null;
        isSearching.value = false;
        return; // Cortamos la ejecución acá, no lo dejamos ver nada
      }
    }

    // Si pasa el candado (o si es otro rol), sigue el flujo normal
    const patientRes = await EhrNursingService.getPatientByDni(dniInput.value.trim());
    const patientData = patientRes.data?.data || patientRes.data;

    if (!patientData || !patientData.id) {
      toastRef.value?.show('No existe un paciente con ese DNI.', 'error');
      currentPatient.value = null;
      return;
    }

    currentPatient.value = patientData;
    await loadPatientClinicalData(patientData.id);
    
    if (authStore.userRole !== 'PATIENT') {
      toastRef.value?.show('Historia Clínica cargada correctamente.', 'success');
    }
  } catch (error: any) {
    currentPatient.value = null;
    medicalRecord.value = null;
    const msg = error.response?.data?.message || 'No se encontró ningún paciente con ese DNI.';
    toastRef.value?.show(msg, 'error');
  } finally {
    isSearching.value = false;
  }
};

const loadPatientClinicalData = async (patientId: string) => {
  try {
    const recordRes = await EhrNursingService.getMedicalRecord(patientId);
    medicalRecord.value = recordRes.data?.data || recordRes.data;
  } catch (err) {
    if (authStore.userRole === 'PATIENT') {
      medicalRecord.value = { progressNotes: [], careProtocols: [] };
      return;
    }
    
    try {
      const createdRes = await EhrNursingService.createMedicalRecord(patientId);
      medicalRecord.value = createdRes.data?.data || createdRes.data;
      toastRef.value?.show('Historia Clínica iniciada para este paciente.', 'success');
    } catch (createErr) {
      medicalRecord.value = { progressNotes: [], careProtocols: [] };
    }
  }
};

const submitProgressNote = async () => {
  if (!currentPatient.value?.id || !newProgressNote.value.trim()) return;
  isSubmitting.value = true;
  try {
    const doctorIdentifier = (authStore as any).userFullName || 'Médico de Turno';
    await EhrNursingService.addProgressNote(
      currentPatient.value.id,
      doctorIdentifier,
      newProgressNote.value.trim()
    );
    toastRef.value?.show('Evolución médica guardada.', 'success');
    newProgressNote.value = '';
    await loadPatientClinicalData(currentPatient.value.id);
  } catch (error: any) {
    const msg = error.response?.data?.message || 'Error al guardar la evolución.';
    toastRef.value?.show(msg, 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('es-AR');
};
</script>

<template>
  <div class="ehr-container">
    <header class="ehr-header">
      <div>
        <h2>{{ authStore.userRole === 'PATIENT' ? 'Mi Historia Clínica' : 'Historia Clínica Electrónica (HCE)' }}</h2>
        <p v-if="currentPatient" class="patient-meta">
          Paciente: <strong>{{ currentPatient.firstName }} {{ currentPatient.lastName }}</strong>
          <span v-if="currentPatient.dni"> | DNI: <strong>{{ currentPatient.dni }}</strong></span>
        </p>
      </div>

      <div class="search-bar" v-if="authStore.userRole !== 'PATIENT'">
        <input
          v-model="dniInput"
          type="text"
          placeholder="Buscar paciente por DNI..."
          @keyup.enter="searchByDniAndLoadHce"
        />
        <button @click="searchByDniAndLoadHce" :disabled="isSearching" class="btn-primary">
          {{ isSearching ? 'Buscando...' : 'Buscar HCE' }}
        </button>
      </div>
    </header>

    <div v-if="currentPatient" class="ehr-grid" :class="{ 'patient-view': authStore.userRole === 'PATIENT' }">
      <!-- Columna Izquierda: Evoluciones Médicas -->
      <section class="panel">
        <h3>Evoluciones Médicas</h3>
        <div class="notes-list">
          <div
            v-for="(note, index) in medicalRecord?.progressNotes"
            :key="index"
            class="note-card"
          >
            <p class="note-meta">
              {{ formatDate(note.date || note.createdAt) }} — Médico: {{ note.doctorId }}
            </p>
            <p class="note-text">{{ note.note || note.content }}</p>
          </div>
          <p v-if="!medicalRecord?.progressNotes?.length" class="empty-state">
            No hay evoluciones registradas todavía para este paciente.
          </p>
        </div>

        <form 
          v-if="authStore.userRole !== 'PATIENT'" 
          @submit.prevent="submitProgressNote" 
          class="add-note-form mt-4"
        >
          <label>Nueva Evolución Clínica:</label>
          <textarea
            v-model="newProgressNote"
            rows="4"
            placeholder="Escriba la evolución clínica del paciente..."
            required
          ></textarea>
          <button type="submit" class="btn-primary mt-2" :disabled="isSubmitting">
            Agregar Evolución
          </button>
        </form>
      </section>

      <!-- Columna Derecha: Protocolos de Cuidados -->
      <section class="panel" v-if="authStore.userRole !== 'PATIENT'">
        <h3>Protocolos de Cuidados Activos</h3>
        <div class="protocols-list">
          <div
            v-for="(protocol, index) in medicalRecord?.careProtocols"
            :key="index"
            class="protocol-card"
          >
            <p class="protocol-meta">
              {{ formatDate(protocol.createdAt) }} — Tipo: {{ protocol.protocolType?.replace('INGRESO_', '').replace(/_/g, ' ') }}
            </p>
            <ul class="protocol-tasks">
              <li v-for="(task, i) in protocol.tasks" :key="i">✅ {{ task }}</li>
            </ul>
            <p class="isolation-badge" v-if="protocol.isolationRequired">
              ⚠️ Requiere Aislamiento
            </p>
          </div>
          <p v-if="!medicalRecord?.careProtocols?.length" class="empty-state">
            El paciente no tiene protocolos de cuidados asignados.
          </p>
        </div>
      </section>
    </div>

    <div v-else class="empty-search-state">
      <span v-if="authStore.userRole === 'PATIENT'">
        Cargando tu historia clínica...
      </span>
      <span v-else>
        Ingresá el DNI de un paciente arriba para consultar su Historia Clínica.
      </span>
    </div>

    <ToastAlert ref="toastRef" />
  </div>
</template>

<style scoped>
.ehr-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
.ehr-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #ecf0f1; padding-bottom: 12px; flex-wrap: wrap; gap: 15px; }
.patient-meta { color: #34495e; margin-top: 5px; font-size: 0.95em; }
.search-bar { display: flex; gap: 10px; }
.search-bar input { padding: 9px 12px; border: 1px solid #ccc; border-radius: 4px; min-width: 240px; }

.ehr-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; align-items: start; }
.ehr-grid.patient-view { grid-template-columns: 1fr; }

.panel { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.note-card { background: #f8f9fa; padding: 15px; border-left: 4px solid #0aa28a; margin-bottom: 15px; border-radius: 4px; }
.note-meta { font-size: 0.85em; color: #7f8c8d; margin-bottom: 5px; font-weight: bold; }
.note-text { margin: 0; color: #2c3e50; line-height: 1.5; }
.add-note-form textarea { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-top: 5px; resize: vertical; }
.btn-primary { padding: 10px 18px; background: #0aa28a; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
.empty-state { text-align: center; color: #95a5a6; padding: 20px; font-style: italic; }
.empty-search-state { background: white; padding: 35px; text-align: center; color: #7f8c8d; border-radius: 8px; font-style: italic; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.mt-4 { margin-top: 20px; }
.mt-2 { margin-top: 10px; }
.protocol-card { background: #f4ebf8; padding: 15px; border-left: 4px solid #8e44ad; margin-bottom: 15px; border-radius: 4px; }
.protocol-meta { font-size: 0.85em; color: #5b2c6f; margin-bottom: 8px; font-weight: bold; text-transform: capitalize; }
.protocol-tasks { margin: 0; padding-left: 20px; font-size: 0.9em; color: #2c3e50; }
.protocol-tasks li { margin-bottom: 4px; }
.isolation-badge { margin-top: 10px; display: inline-block; background: #e74c3c; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75em; font-weight: bold; }
</style>