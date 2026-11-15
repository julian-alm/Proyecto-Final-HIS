<script setup lang="ts">
import { ref } from 'vue';
import VitalSignsControl from '../components/VitalSignsControl.vue';
import MedicationAdministration from '../components/MedicationAdministration.vue';
import { EhrNursingService } from '../services/ehr-nursing.service';
import ToastAlert from '../../../shared/components/ToastAlert.vue';

const dniInput = ref('');
const currentPatient = ref<any>(null);
const isSearching = ref(false);

const admissionReason = ref('');
const generatedProtocol = ref<any>(null);
const isGeneratingProtocol = ref(false);
const toastRef = ref<InstanceType<typeof ToastAlert> | null>(null);

// Busca al paciente real en la BD por su DNI
const searchPatientByDni = async () => {
  if (!dniInput.value.trim()) return;
  isSearching.value = true;
  generatedProtocol.value = null;

  try {
    const res = await EhrNursingService.getPatientByDni(dniInput.value.trim());
    const patientData = res.data?.data || res.data;

    if (!patientData || !patientData.id) {
      toastRef.value?.show('No se encontró ningún paciente con ese DNI en la base de datos.', 'error');
      currentPatient.value = null;
      return;
    }

    currentPatient.value = patientData;
    toastRef.value?.show(`Paciente ${patientData.fullName || patientData.name || ''} cargado correctamente.`, 'success');
  } catch (error: any) {
    currentPatient.value = null;
    const msg = error.response?.data?.message || 'Paciente no encontrado. Verificá que esté registrado.';
    toastRef.value?.show(msg, 'error');
  } finally {
    isSearching.value = false;
  }
};

// Genera protocolo usando el Builder del backend (/nursing-care/protocols/generate)
const handleGenerateProtocol = async () => {
  if (!currentPatient.value?.id || !admissionReason.value.trim()) return;
  isGeneratingProtocol.value = true;

  try {
    const res = await EhrNursingService.generateProtocol({
      patientId: currentPatient.value.id,
      admissionReason: admissionReason.value.trim()
    });
    generatedProtocol.value = res.data?.data || res.data;
    toastRef.value?.show('Protocolo de cuidados generado correctamente.', 'success');
    admissionReason.value = '';
  } catch (error: any) {
    const msg = error.response?.data?.message || 'Error al generar el protocolo de enfermería.';
    toastRef.value?.show(msg, 'error');
  } finally {
    isGeneratingProtocol.value = false;
  }
};
</script>

<template>
  <div class="nursing-container">
    <h2>Panel de Enfermería</h2>

    <!-- Buscador conectado a la BD por DNI -->
    <div class="search-box">
      <label>Buscar Paciente por DNI:</label>
      <div class="search-input-group">
        <input
          v-model="dniInput"
          type="text"
          placeholder="Ingrese el DNI del paciente registrado..."
          @keyup.enter="searchPatientByDni"
        />
        <button @click="searchPatientByDni" :disabled="isSearching" class="btn-search">
          {{ isSearching ? 'Buscando...' : 'Buscar por DNI' }}
        </button>
      </div>
    </div>

    <!-- Datos reales del paciente traídos del Backend -->
    <div v-if="currentPatient" class="active-patient-section">
      <div class="patient-banner">
        <div>
          <span class="patient-label">Paciente:</span>
          <strong>{{ currentPatient.firstName }} {{ currentPatient.lastName }}</strong>
        </div>
        <div>
          <span class="patient-label">DNI:</span>
          <strong>{{ currentPatient.dni }}</strong>
        </div>
      </div>

      <!-- 1. Control de Signos Vitales (HU 1.1) -->
      <VitalSignsControl :patientId="currentPatient.id" />

      <!-- 2. Administración de Medicación (HU 1.2) -->
      <MedicationAdministration :patientId="currentPatient.id" />

      <!-- 3. Generador de Protocolo de Enfermería (Builder Pattern) -->
      <div class="protocol-card">
        <h3>Generar Protocolo de Cuidados</h3>
        <form @submit.prevent="handleGenerateProtocol" class="protocol-form">
          <div class="input-group">
            <label>Motivo de Admisión / Diagnóstico</label>
            <input
              v-model="admissionReason"
              type="text"
              placeholder="Ej: Fiebre / Post-operatorio / Guardia"
              required
            />
          </div>
          <button type="submit" :disabled="isGeneratingProtocol" class="btn-protocol">
            Generar Protocolo
          </button>
        </form>

        <!-- FORMATO DE FICHA MÉDICA APLICADO ACÁ -->
        <div v-if="generatedProtocol" class="protocol-result-box">
          <h4>Protocolo Generado por el Sistema:</h4>
          
          <div class="protocol-info">
            <p>
              <strong>Paciente:</strong> 
              {{ currentPatient.firstName }} {{ currentPatient.lastName }}
            </p>
            <p>
              <strong>Motivo de protocolo:</strong> 
              {{ generatedProtocol.protocolType.replace('INGRESO_', '').replace(/_/g, ' ') }}
            </p>
            <p>
              <strong>Aislamiento requerido:</strong> 
              <span :class="generatedProtocol.isolationRequired ? 'text-danger' : 'text-success'">
                {{ generatedProtocol.isolationRequired ? 'Sí ⚠️' : 'No' }}
              </span>
            </p>
          </div>

          <div class="protocol-tasks">
            <strong>Cuidados a realizar:</strong>
            <ul>
              <li v-for="(task, index) in generatedProtocol.tasks" :key="index">
                ✅ {{ task }}
              </li>
            </ul>
          </div>
        </div>
        <!-- FIN FORMATO FICHA MÉDICA -->
        
      </div>
    </div>

    <div v-else class="empty-patient">
      Ingresá el DNI de un paciente registrado arriba para habilitar los controles de enfermería.
    </div>

    <ToastAlert ref="toastRef" />
  </div>
</template>

<style scoped>
.nursing-container { max-width: 950px; margin: 0 auto; padding: 20px; }
.search-box { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; }
.search-input-group { display: flex; gap: 10px; margin-top: 8px; }
.search-input-group input { flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
.btn-search { padding: 10px 18px; background: #0aa28a; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
.active-patient-section { background: #f8f9fa; padding: 18px; border-radius: 8px; }
.patient-banner { display: flex; flex-wrap: wrap; gap: 20px; background: #e8f8f5; border-left: 4px solid #0aa28a; padding: 12px 16px; border-radius: 6px; margin-bottom: 15px; }
.patient-label { color: #555; margin-right: 6px; }
.empty-patient { background: white; padding: 30px; text-align: center; color: #7f8c8d; border-radius: 8px; font-style: italic; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.protocol-card { padding: 20px; border-radius: 8px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-top: 20px; }
.protocol-form { display: flex; gap: 15px; align-items: flex-end; flex-wrap: wrap; margin-top: 10px; }
.input-group { display: flex; flex-direction: column; flex: 1; min-width: 240px; }
.input-group label { font-size: 0.85em; font-weight: bold; color: #34495e; margin-bottom: 5px; }
.input-group input { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
.btn-protocol { padding: 10px 15px; background: #8e44ad; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; height: 38px; }
.btn-protocol:hover { background: #732d91; }

/* NUEVOS ESTILOS DEL PROTOCOLO */
.protocol-result-box { background-color: #f4ebf8; border-left: 4px solid #8e44ad; padding: 15px 20px; border-radius: 4px; margin-top: 15px; color: #2c3e50; }
.protocol-result-box h4 { margin: 0 0 12px 0; color: #5b2c6f; }
.protocol-info p { margin: 5px 0; font-size: 0.95em; }
.protocol-tasks { margin-top: 15px; background: white; padding: 15px; border-radius: 4px; }
.protocol-tasks ul { margin-top: 10px; padding-left: 20px; margin-bottom: 0; }
.protocol-tasks li { margin-bottom: 8px; }
.text-danger { color: #c0392b; font-weight: bold; }
.text-success { color: #27ae60; font-weight: bold; }
</style>