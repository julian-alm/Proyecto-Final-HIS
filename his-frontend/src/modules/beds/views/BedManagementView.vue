<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { BedManagementService, BedDto } from '../services/bed-management.service';

const beds = ref<BedDto[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');

// Cargar las camas al montar el componente
const loadBeds = async () => {
    try {
        isLoading.value = true;
        const response = await BedManagementService.getAllBeds();
        beds.value = response.data;
    } catch (error) {
        console.error('Error fetching beds:', error);
        errorMessage.value = 'Failed to load beds data.';
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    loadBeds();
});

// Acciones de las camas
const handleAssign = async (bedId: string) => {
    const patientId = prompt('Enter Patient ID to assign:');
    if (!patientId) return;
    
    try {
        await BedManagementService.assignBed(bedId, patientId);
        await loadBeds(); // Recargar grilla
    } catch (error) {
        alert('Error assigning bed.');
    }
};

const handleDischarge = async (bedId: string) => {
    if (!confirm('Are you sure you want to discharge this patient?')) return;
    try {
        await BedManagementService.dischargeBed(bedId);
        await loadBeds();
    } catch (error) {
        alert('Error discharging patient.');
    }
};

const handleClean = async (bedId: string) => {
    try {
        await BedManagementService.cleanBed(bedId);
        await loadBeds();
    } catch (error) {
        alert('Error cleaning bed.');
    }
};
</script>

<template>
    <div class="beds-container">
        <h2>Bed Management</h2>
        
        <div v-if="errorMessage" class="error-alert">{{ errorMessage }}</div>
        <div v-if="isLoading">Loading beds...</div>
        
        <div v-else class="beds-grid">
            <div 
                v-for="bed in beds" 
                :key="bed.id" 
                class="bed-card" 
                :class="bed.status.toLowerCase()"
            >
            <h3>Room {{ bed.roomNumber }} - Bed {{ bed.bedNumber }}</h3>
            <p class="status">Status: <strong>{{ bed.status }}</strong></p>
            <p v-if="bed.patientId">Patient ID: {{ bed.patientId }}</p>
            
            <div class="actions">
                <button 
                    v-if="bed.status === 'LIBRES'" 
                    @click="handleAssign(bed.id)"
                >
                Assign Patient
                </button>
                <button 
                    v-if="bed.status === 'OCUPADAS'" 
                    @click="handleDischarge(bed.id)" 
                    class="btn-warning"
                >
                Discharge
                </button>
                <button 
                    v-if="bed.status === 'EN_LIMPIEZA'" 
                    @click="handleClean(bed.id)" 
                    class="btn-success"
                >
                Mark as Clean
                </button>
            </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.beds-container { padding: 20px; }
.beds-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
.bed-card { padding: 15px; border-radius: 8px; border: 1px solid #ccc; background-color: #f9f9f9; }
.bed-card.available { border-left: 5px solid #42b983; }
.bed-card.occupied { border-left: 5px solid #e74c3c; }
.bed-card.cleaning { border-left: 5px solid #f39c12; }
.status { font-size: 1.1em; }
.actions { margin-top: 15px; display: flex; gap: 10px; }
button { padding: 8px 12px; cursor: pointer; border: none; border-radius: 4px; background-color: #3498db; color: white; }
.btn-warning { background-color: #e74c3c; }
.btn-success { background-color: #42b983; }
.error-alert { color: #e74c3c; margin-bottom: 15px; }
</style>