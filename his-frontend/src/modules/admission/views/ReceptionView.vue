<script setup lang="ts">
import { ref } from 'vue';
import { AdmissionService } from '../services/admission.service';
import ToastAlert from '../../../shared/components/ToastAlert.vue';

const patientData = ref({
    dni: '',
    firstName: '',
    lastName: '',
    coverageType: 'PRIVATE'
});

const isSubmitting = ref(false);
const toastRef = ref<InstanceType<typeof ToastAlert> | null>(null);

const handleRegisterPatient = async () => {
    isSubmitting.value = true;
    
    try {
        const response = await AdmissionService.registerPatient(patientData.value);
        toastRef.value?.show(`Paciente registrado con éxito. ID: ${response.data.patientId.id}`, 'success');
        patientData.value = { dni: '', firstName: '', lastName: '', coverageType: 'PRIVATE' };
    } catch (error) {
        console.error('Error al registrar paciente:', error);
        toastRef.value?.show('Hubo un error al registrar al paciente.', 'error');
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <div class="reception-container">
        <div class="form-card">
            <h2>Registrar nuevo paciente</h2>

            <form @submit.prevent="handleRegisterPatient" class="patient-form">
                <div class="input-group">
                    <label>DNI</label>
                    <input v-model="patientData.dni" type="text" placeholder="Ej. 12345678" required />
                </div>
                
                <div class="input-group">
                    <label>Nombre</label>
                    <input v-model="patientData.firstName" type="text" placeholder="Ej. Juan" required />
                </div>
                
                <div class="input-group">
                    <label>Apellido</label>
                    <input v-model="patientData.lastName" type="text" placeholder="Ej. Pérez" required />
                </div>
                
                <div class="input-group">
                    <label>Cobertura</label>
                    <select v-model="patientData.coverageType">
                        <option value="PUBLIC">Pública</option>
                        <option value="PREPAID">Prepaga</option>
                        <option value="PRIVATE">Particular</option>
                    </select>
                </div>

                <button type="submit" class="btn-submit" :disabled="isSubmitting">
                    + {{ isSubmitting ? 'Registrando...' : 'Registrar Paciente' }}
                </button>
            </form>
        </div>

        <ToastAlert ref="toastRef" />
    </div>
</template>

<style scoped>
.reception-container { 
    display: flex;
    justify-content: center;
    padding: 30px 20px;
}

.form-card {
    background: white;
    padding: 35px 40px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    width: 100%;
    max-width: 600px;
    box-sizing: border-box;
}

.form-card h2 {
    margin-top: 0;
    margin-bottom: 25px;
    color: #1a2a3a;
    font-size: 1.5rem;
    font-weight: 700;
}

.patient-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.input-group {
    display: flex;
    flex-direction: column;
}

label { 
    margin-bottom: 8px; 
    font-weight: 600; 
    color: #34495e;
    font-size: 0.95rem;
}

input, select { 
    width: 100%; 
    padding: 12px 15px; 
    box-sizing: border-box; 
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    font-size: 1rem;
    color: #2c3e50;
    background-color: #fff;
    transition: border-color 0.2s ease;
}

input::placeholder {
    color: #a8b2bc;
}

input:focus, select:focus {
    outline: none;
    border-color: #0aa28a;
}

.btn-submit { 
    margin-top: 10px;
    padding: 14px; 
    background-color: #0aa28a; 
    color: white; 
    border: none; 
    border-radius: 6px;
    cursor: pointer; 
    font-size: 1.05rem;
    font-weight: 700;
    transition: background-color 0.2s ease;
}

.btn-submit:hover:not(:disabled) {
    background-color: #08836f;
}

.btn-submit:disabled { 
    background-color: #95a5a6;
    cursor: not-allowed;
}
</style>