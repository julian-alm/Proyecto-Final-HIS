<script setup lang="ts">
import { ref } from 'vue';
import { AdmissionService } from '../services/admission.service';

// 1. Estado para la búsqueda del paciente
const searchDni = ref('');
const patientDetails = ref<any>(null);
const patientIdToSubmit = ref(''); // Aquí se guarda el UUID real de forma invisible
const isSearching = ref(false);

// 2. Estado para el Formulario de Turnos Normales
const appointmentForm = ref({
  doctorId: '',
  date: ''
});

// 3. Estado para el Formulario de Triaje
const triageForm = ref({
  level: 3,
  symptoms: ''
});

// --- FUNCIONES ---

const searchPatient = async () => {
  if (!searchDni.value) return;
  
  isSearching.value = true;
  try {
    const response = await AdmissionService.getPatientByDni(searchDni.value);
    // Asumimos que el backend devuelve { id, firstName, lastName, ... }
    patientDetails.value = response.data;
    patientIdToSubmit.value = response.data.id; 
  } catch (error) {
    alert('Paciente no encontrado con ese DNI. Verifique o registre al paciente primero.');
    patientDetails.value = null;
    patientIdToSubmit.value = '';
  } finally {
    isSearching.value = false;
  }
};

const handleBookAppointment = async () => {
  if (!patientIdToSubmit.value) {
    alert('Debe buscar y seleccionar un paciente primero.');
    return;
  }
  
  try {
    await AdmissionService.bookAppointment({
      patientId: patientIdToSubmit.value,
      doctorId: appointmentForm.value.doctorId,
      date: appointmentForm.value.date
    });
    alert('Turno normal asignado con éxito (Estado: RESERVADO)');
    appointmentForm.value = { doctorId: '', date: '' };
    resetPatientSearch();
  } catch (error) {
    alert('Error al reservar el turno.');
  }
};

const handleAddTriage = async () => {
  if (!patientIdToSubmit.value) {
    alert('Debe buscar y seleccionar un paciente primero.');
    return;
  }

  try {
    await AdmissionService.addToTriage({
      patientId: patientIdToSubmit.value,
      level: triageForm.value.level,
      symptoms: triageForm.value.symptoms
    });
    alert('Paciente ingresado a Triaje de Urgencias (Estado: EN_ESPERA)');
    triageForm.value = { level: 3, symptoms: '' };
    resetPatientSearch();
  } catch (error) {
    alert('Error al registrar el paciente en triaje.');
  }
};

const resetPatientSearch = () => {
  searchDni.value = '';
  patientDetails.value = null;
  patientIdToSubmit.value = '';
};
</script>

<template>
    <div class="triage-view-container">
        <h1 class="page-title">Asignación de Turnos y Triaje</h1>
        
        <!-- 1. Buscador Central de Pacientes -->
        <section class="panel search-panel">
            <h2>1. Identificar Paciente</h2>
            <div class="search-bar">
                <div class="input-group">
                    <label>Buscar por DNI:</label>
                    <input 
                        v-model="searchDni" 
                        placeholder="Ingrese DNI sin puntos" 
                        @keyup.enter="searchPatient" 
                    />
                </div>
                <button type="button" @click="searchPatient" class="btn-search" :disabled="isSearching">
                    {{ isSearching ? 'Buscando...' : 'Buscar Paciente' }}
                </button>
            </div>

            <div v-if="patientDetails" class="success-alert">
                <strong>Paciente Seleccionado:</strong> 
                {{ patientDetails.firstName }} {{ patientDetails.lastName }} 
                (Cobertura: {{ patientDetails.coverageType }})
            </div>
        </section>

        <!-- 2. Formularios de Acción (Se habilitan solo si hay un paciente seleccionado) -->
        <div class="forms-grid" :class="{ 'disabled-grid': !patientDetails }">
            
            <!-- Panel de Turno Programado -->
            <section class="panel">
                <h2>2A. Asignar Turno Programado</h2>
                <p class="subtitle">El paciente quedará en estado RESERVADO para una fecha futura.</p>
                
                <form @submit.prevent="handleBookAppointment" class="form-container">
                    <div class="input-group">
                        <label>Fecha del Turno:</label>
                        <input v-model="appointmentForm.date" type="date" required :disabled="!patientDetails" />
                    </div>
                    <div class="input-group">
                        <label>ID del Doctor:</label>
                        <input v-model="appointmentForm.doctorId" placeholder="Ej: dr-smith" required :disabled="!patientDetails" />
                    </div>

                    <button type="submit" class="btn-primary" :disabled="!patientDetails">
                        Reservar Turno Programado
                    </button>
                </form>
            </section>

            <!-- Panel de Triaje (Urgencias) -->
            <section class="panel triage-panel">
                <h2>2B. Ingreso por Triaje (Guardia)</h2>
                <p class="subtitle">El paciente ingresará a la cola de espera priorizada.</p>

                <form @submit.prevent="handleAddTriage" class="form-container">
                    <div class="input-group">
                        <label>Síntomas principales:</label>
                        <input v-model="triageForm.symptoms" placeholder="Ej: Dolor agudo en el pecho" required :disabled="!patientDetails" />
                    </div>
                    <div class="input-group">
                        <label>Nivel de Urgencia (Triaje):</label>
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
    </div>
</template>

<style scoped>
.triage-view-container { max-width: 1000px; margin: 0 auto; }
.page-title { margin-bottom: 20px; color: #2c3e50; }

.panel { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; }
.search-panel { border-left: 5px solid #3498db; }
.triage-panel { border-top: 5px solid #e74c3c; }

.search-bar { display: flex; align-items: flex-end; gap: 15px; margin-bottom: 15px; }
.search-bar .input-group { flex: 1; margin-bottom: 0; }

.forms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; transition: opacity 0.3s; }
.disabled-grid { opacity: 0.5; pointer-events: none; }

.subtitle { color: #7f8c8d; font-size: 0.9em; margin-bottom: 20px; }
.form-container .input-group { margin-bottom: 15px; }

label { display: block; font-weight: bold; margin-bottom: 5px; color: #34495e; }
input, select { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; font-size: 1rem; }
input:disabled, select:disabled { background-color: #f5f5f5; cursor: not-allowed; }

button { padding: 12px; font-weight: bold; color: white; border: none; border-radius: 4px; cursor: pointer; transition: background 0.2s; }
button:disabled { background-color: #bdc3c7 !important; cursor: not-allowed; }

.btn-search { background: #2c3e50; height: 42px; padding: 0 20px; }
.btn-primary { background: #3498db; width: 100%; }
.btn-primary:hover { background: #2980b9; }
.btn-danger { background: #e74c3c; width: 100%; }
.btn-danger:hover { background: #c0392b; }

.success-alert { padding: 12px; background-color: #d4edda; color: #155724; border-radius: 4px; border-left: 5px solid #28a745; margin-top: 10px; }
</style>