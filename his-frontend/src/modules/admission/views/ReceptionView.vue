<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { AdmissionService } from '../services/admission.service';
import { useAuthStore } from '../../iam/store/auth.store';
import ToastAlert from '../../../shared/components/ToastAlert.vue';

const authStore = useAuthStore();
const toastRef = ref<InstanceType<typeof ToastAlert> | null>(null);

// --- ESTADO DEL REGISTRO ---
const patientData = ref({
    dni: '',
    firstName: '',
    lastName: '',
    coverageType: 'PRIVATE'
});
const isSubmitting = ref(false);

// --- ESTADO DE LA ASIGNACIÓN ---
const doctors = ref<any[]>([]);
const selectedDoctorId = ref('');
const patientDniToAssign = ref('');
const isAssigning = ref(false);

onMounted(async () => {
    try {
        const response = await AdmissionService.getAllDoctors();
        console.log("1. Lo que mandó el backend:", response); 
        
        // Esta línea a prueba de balas saca los datos vengan como vengan
        const resultado = response.data || response;
        doctors.value = resultado.data || resultado;
        
        console.log("2. Doctores listos para mostrar:", doctors.value);
    } catch (error) {
        console.error("Error al cargar médicos:", error);
    }
});

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

const handleAssignPatient = async () => {
    if (!selectedDoctorId.value || !patientDniToAssign.value.trim()) {
        toastRef.value?.show('Seleccioná un médico e ingresá el DNI.', 'error');
        return;
    }
    isAssigning.value = true;
    try {
        // Usamos tu servicio en lugar del fetch feo
        await AdmissionService.assignPatient(selectedDoctorId.value, patientDniToAssign.value.trim());
        
        toastRef.value?.show('¡Paciente vinculado al médico exitosamente!', 'success');
        patientDniToAssign.value = '';
        selectedDoctorId.value = '';
    } catch (error) {
        console.error('Error de conexión con el servidor:', error);
        toastRef.value?.show('Error de conexión con el servidor.', 'error');
    } finally {
        isAssigning.value = false;
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

        <div class="form-card">
            <h2>Asignar Paciente a Médico</h2>
            <form @submit.prevent="handleAssignPatient" class="patient-form">
                <div class="input-group">
                    <label>Seleccionar Profesional</label>
                    <select v-model="selectedDoctorId" required>
                        <option value="" disabled>-- Elegir un médico --</option>
                        <option v-for="doc in doctors" :key="doc.id" :value="doc.id">
                         Dr/a. {{ doc.fullName }} - {{ doc.specialty }}
                        </option>                
                    </select>
                </div>

                <div class="input-group">
                    <label>DNI del Paciente</label>
                    <input v-model="patientDniToAssign" type="text" placeholder="Ej. 11223344" required />
                </div>

                <button type="submit" class="btn-submit btn-assign" :disabled="isAssigning">
                    {{ isAssigning ? 'Vinculando...' : 'Vincular Paciente' }}
                </button>
            </form>
        </div>

        <ToastAlert ref="toastRef" />
    </div>
</template>

<style scoped>
.reception-container { 
    display: flex;
    flex-wrap: wrap;
    gap: 30px;
    justify-content: center;
    padding: 30px 20px;
}

.form-card {
    background: white;
    padding: 35px 40px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    width: 100%;
    max-width: 500px;
    box-sizing: border-box;
    height: fit-content;
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

.btn-assign { 
    background-color: #2c3e50; 
}

.btn-assign:hover:not(:disabled) { 
    background-color: #1a252f; 
}
</style>