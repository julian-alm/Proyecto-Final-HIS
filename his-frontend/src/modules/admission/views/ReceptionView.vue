<script setup lang="ts">
import { ref } from 'vue';
import { AdmissionService } from '../services/admission.service';

const patientData = ref({
    dni: '',
    firstName: '',
    lastName: '',
    coverageType: 'PRIVATE'
});

const isSubmitting = ref(false);
const successMessage = ref('');

const handleRegisterPatient = async () => {
    isSubmitting.value = true;
    successMessage.value = '';
    
    try {
        const response = await AdmissionService.registerPatient(patientData.value);
        successMessage.value = `Paciente registrado con éxito. ID: ${response.data.patientId.id}`;
        
        // Limpiar formulario
        patientData.value = { dni: '', firstName: '', lastName: '', coverageType: 'PRIVATE' };
    } catch (error) {
        console.error('Error al registrar paciente:', error);
        alert('Hubo un error al registrar al paciente.');
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <div class="reception-container">
        <h2>Recepción - Registro de Pacientes</h2>

        <div v-if="successMessage" class="success-alert">
            {{ successMessage }}
        </div>

        <form @submit.prevent="handleRegisterPatient" class="patient-form">
            <div>
                <label>DNI:</label>
                <input v-model="patientData.dni" type="text" required />
            </div>
            <div>
                <label>Nombre:</label>
                <input v-model="patientData.firstName" type="text" required />
            </div>
            <div>
                <label>Apellido:</label>
                <input v-model="patientData.lastName" type="text" required />
            </div>
            <div>
                <label>Cobertura:</label>
                <select v-model="patientData.coverageType">
                <option value="PUBLIC">Pública</option>
                <option value="PREPAID">Prepaga</option>
                <option value="PRIVATE">Particular</option>
                </select>
            </div>

            <button type="submit" :disabled="isSubmitting">
                {{ isSubmitting ? 'Registrando...' : 'Registrar Paciente' }}
            </button>
        </form>
    </div>
</template>

<style scoped>
.reception-container { padding: 20px; max-width: 600px; }
.patient-form div { margin-bottom: 15px; }
label { display: block; margin-bottom: 5px; font-weight: bold; }
input, select { width: 100%; padding: 8px; box-sizing: border-box; }
button { padding: 10px 15px; background-color: #42b983; color: white; border: none; cursor: pointer; }
button:disabled { background-color: #a0a0a0; }
.success-alert { padding: 10px; background-color: #d4edda; color: #155724; margin-bottom: 15px; }
</style>