<template>
  <div class="beds-page">
    <!-- Encabezado moderno sin el botón extra -->
    <div class="page-header">
      <span class="breadcrumb">Operación / Camas e Inventario</span>
      <div class="header-flex">
        <div>
          <h1>Panel de Internación y Camas</h1>
          <p>Estado en tiempo real de las habitaciones</p>
        </div>
      </div>
    </div>

    <!-- Barra de Referencias tipo Cápsulas con contador -->
    <div class="legend-bar">
      <span class="legend-title">Referencias:</span>
      <span class="legend-item capsule-libres">
        <div class="dot dot-libres"></div> Libres • {{ countStatus('LIBRES') }}
      </span>
      <span class="legend-item capsule-ocupadas">
        <div class="dot dot-ocupadas"></div> Ocupadas • {{ countStatus('OCUPADAS') }}
      </span>
      <span class="legend-item capsule-limpieza">
        <div class="dot dot-limpieza"></div> En limpieza • {{ countStatus('EN_LIMPIEZA') }}
      </span>
      <span class="legend-item capsule-bloqueadas">
        <div class="dot dot-bloqueadas"></div> Bloqueadas • {{ countStatus('BLOQUEADAS') }}
      </span>
    </div>

    <div v-if="loading" class="loading-state">Cargando mapa de camas...</div>
    <div v-if="errorMessage" class="alert alert-error">{{ errorMessage }}</div>
    <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

    <!-- Cuadrícula de Camas -->
    <div class="beds-grid" v-if="!loading">
      <div 
        v-for="(bed, index) in bedsList" 
        :key="bed.id"
        class="bed-card"
        :class="getBorderClass(bed.status)"
      >
        <div class="bed-header">
          <span class="room-badge">HAB. {{ bed.roomNumber }}</span>
          <span class="status-badge" :class="getBadgeClass(bed.status)">
            {{ formatStatusName(bed.status) }}
          </span>
        </div>
        
        <div class="bed-body">
          <h3>Cama {{ index + 1 }}</h3> 
          
          <div class="patient-info" v-if="bed.status === 'OCUPADAS' && bed.patientId">
            <div class="avatar">{{ getInitials(bed.patientFullName || localPatients[bed.id]) }}</div>
            <div class="patient-details">
              <strong>{{ bed.patientFullName || (localPatients[bed.id] ? localPatients[bed.id].split('(')[0] : 'Paciente') }}</strong>
              <span>DNI: {{ bed.patientDni || 'Cargando...' }}</span>
            </div>
          </div>
          
          <div class="patient-info empty" v-else-if="bed.status === 'EN_LIMPIEZA'">
            <span>Limpieza requerida</span>
          </div>
          <div class="patient-info empty" v-else-if="bed.status === 'BLOQUEADAS'">
            <span>Fuera de servicio • Mantenimiento</span>
          </div>
          <div class="patient-info empty" v-else>
            <span>Sin paciente asignado</span>
          </div>
        </div>

        <div class="bed-actions">
          <!-- Acciones para cama LIBRE -->
          <div class="action-group" v-if="bed.status === 'LIBRES'">
            <button v-if="canAssign" class="btn btn-teal flex-grow" @click="promptAssignBed(bed.id)">
              Ingresar
            </button>
            <button v-if="canBlock" class="btn btn-light" @click="promptBlock(bed.id)">
              Mantenim.
            </button>
          </div>

          <!-- Acciones para cama OCUPADA -->
          <button 
            v-if="bed.status === 'OCUPADAS' && canDischarge"
            class="btn btn-light full-width"
            @click="promptDischarge(bed.id)"
          >
            Procesar Alta
          </button>

          <!-- Acciones para cama EN LIMPIEZA -->
          <div class="action-group" v-if="bed.status === 'EN_LIMPIEZA'">
            <button v-if="canClean" class="btn btn-light full-width" @click="promptClean(bed.id)">
              Marcar como lista
            </button>
            <button v-if="canBlock" class="btn btn-light icon-only" title="Mantenimiento" @click="promptBlock(bed.id)">
              ⚙️
            </button>
          </div>

          <!-- Acciones para cama BLOQUEADA -->
          <button 
            v-if="bed.status === 'BLOQUEADAS' && canBlock"
            class="btn btn-light full-width"
            @click="promptUnblock(bed.id)"
          >
            Reactivar cama
          </button>
        </div>
      </div>
    </div>
    
    <!-- Modal 1: Asignación de Paciente -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeAssignModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Ingresar Paciente a Cama</h2>
          <button class="btn-close" @click="closeAssignModal">✕</button>
        </div>
        <div class="modal-body">
          <label>Buscar por DNI</label>
          <div class="search-row">
            <input 
              v-model.trim="dniQuery" 
              type="text" 
              placeholder="Ej. 30.112.455" 
              @keyup.enter="handleSearchDni"
              :disabled="searching"
            />
            <button class="btn btn-teal" @click="handleSearchDni" :disabled="searching || !dniQuery">
              {{ searching ? 'Buscando...' : 'Buscar' }}
            </button>
          </div>
          <div v-if="searchError" class="alert alert-error mt-1">{{ searchError }}</div>
          <div v-if="patientFound" class="patient-badge mt-1">
            <strong>{{ patientFound.firstName }} {{ patientFound.lastName }}</strong>
            <span>DNI: {{ patientFound.dni }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-light" @click="closeAssignModal">Cancelar</button>
          <button class="btn btn-primary" :disabled="!patientFound" @click="confirmAssignBed">
            Confirmar Ingreso
          </button>
        </div>
      </div>
    </div>

    <!-- Modal 2: Confirmación de Acciones -->
    <div v-if="confirmDialog.show" class="modal-overlay" @click.self="closeConfirm">
      <div class="modal-content modal-sm">
        <div class="modal-header">
          <h2>Confirmar Acción</h2>
          <button class="btn-close" @click="closeConfirm">✕</button>
        </div>
        <div class="modal-body text-center mt-1">
          <p>{{ confirmDialog.message }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-light" @click="closeConfirm">Cancelar</button>
          <button class="btn btn-primary" @click="executeConfirm">Confirmar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useAuthStore } from '../../iam/store/auth.store';
import { bedService } from '../services/bed-management.service';
import type { BedItem, BedStateName, PatientLookup } from '../types/bed.types';

const authStore = useAuthStore();
const bedsList = ref<BedItem[]>([]);
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const localPatients = reactive<Record<string, string>>({});

// --- Permisos por Rol ---
const canAssign = computed(() => ['ADMIN', 'RECEPTIONIST'].includes(authStore.userRole || ''));
const canDischarge = computed(() => ['ADMIN', 'RECEPTIONIST'].includes(authStore.userRole || ''));
const canClean = computed(() => ['ADMIN', 'CLEANER'].includes(authStore.userRole || ''));
const canBlock = computed(() => ['ADMIN'].includes(authStore.userRole || ''));

const loadBeds = async () => {
  loading.value = true;
  try {
    bedsList.value = await bedService.getBeds();
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Error de conexión al cargar el mapa de camas.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => loadBeds());

// --- Utilidad para Avatares ---
const getInitials = (name?: string) => {
  if (!name) return 'PT';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

// --- ESTADO MODAL ASIGNACIÓN ---
const showModal = ref(false);
const selectedBedId = ref('');
const dniQuery = ref('');
const searching = ref(false);
const searchError = ref('');
const patientFound = ref<PatientLookup | null>(null);

const closeAssignModal = () => showModal.value = false;

const promptAssignBed = (bedId: string) => {
  selectedBedId.value = bedId;
  dniQuery.value = '';
  searchError.value = '';
  patientFound.value = null;
  showModal.value = true;
};

const handleSearchDni = async () => {
  if (!dniQuery.value) return;
  searchError.value = '';
  patientFound.value = null;
  searching.value = true;
  try {
    patientFound.value = await bedService.findPatientByDni(dniQuery.value);
  } catch (error: any) {
    searchError.value = error.response?.data?.message || 'Paciente no encontrado.';
  } finally {
    searching.value = false;
  }
};

const confirmAssignBed = async () => {
  if (!patientFound.value || !selectedBedId.value) return;
  errorMessage.value = '';
  successMessage.value = '';
  try {
    await bedService.assignBed(selectedBedId.value, patientFound.value.id);
    localPatients[selectedBedId.value] = `${patientFound.value.firstName} ${patientFound.value.lastName} (DNI: ${patientFound.value.dni})`;
    successMessage.value = `Paciente ingresado exitosamente.`;
    closeAssignModal(); 
    await loadBeds();
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Error al asignar la cama.';
    closeAssignModal(); 
  }
};

// --- ESTADO MODAL DE ACCIONES ---
const confirmDialog = reactive({
  show: false,
  bedId: '',
  message: '',
  action: '' as 'DISCHARGE' | 'CLEAN' | 'BLOCK' | 'UNBLOCK'
});

const closeConfirm = () => confirmDialog.show = false;

const promptDischarge = (bedId: string) => {
  confirmDialog.bedId = bedId;
  confirmDialog.message = '¿Confirmar alta del paciente? La cama pasará a EN LIMPIEZA.';
  confirmDialog.action = 'DISCHARGE';
  confirmDialog.show = true;
};

const promptClean = (bedId: string) => {
  confirmDialog.bedId = bedId;
  confirmDialog.message = '¿Confirmar higienización? La cama pasará a estar DISPONIBLE.';
  confirmDialog.action = 'CLEAN';
  confirmDialog.show = true;
};

const promptBlock = (bedId: string) => {
  confirmDialog.bedId = bedId;
  confirmDialog.message = '¿Confirmar envío de cama a mantenimiento?';
  confirmDialog.action = 'BLOCK';
  confirmDialog.show = true;
};

const promptUnblock = (bedId: string) => {
  confirmDialog.bedId = bedId;
  confirmDialog.message = '¿Confirmar que la cama está reparada y habilitada?';
  confirmDialog.action = 'UNBLOCK';
  confirmDialog.show = true;
};

const executeConfirm = async () => {
  const { bedId, action } = confirmDialog;
  closeConfirm();
  errorMessage.value = '';
  successMessage.value = '';
  try {
    if (action === 'DISCHARGE') {
      await bedService.dischargeBed(bedId);
      successMessage.value = 'Alta procesada. Cama bloqueada hasta higiene.';
    } else if (action === 'CLEAN') {
      await bedService.cleanBed(bedId);
      successMessage.value = 'Higiene confirmada. Cama liberada y lista para uso.';
    } else if (action === 'BLOCK') {
      await bedService.blockBed(bedId);
      successMessage.value = 'Cama inhabilitada por mantenimiento.';
    } else if (action === 'UNBLOCK') {
      await bedService.unblockBed(bedId);
      successMessage.value = 'Cama habilitada correctamente.';
    }
    await loadBeds();
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Error al procesar la acción.';
  }
};

// --- Utilidades Visuales ---
// --- Utilidad para Contar Estados ---
const countStatus = (status: BedStateName) => {
  return bedsList.value.filter(bed => bed.status === status).length;
};
const formatStatusName = (status: BedStateName) => {
  const map: Record<BedStateName, string> = {
    LIBRES: 'Disponible',
    OCUPADAS: 'Ocupada',
    EN_LIMPIEZA: 'En limpieza',
    BLOQUEADAS: 'Bloqueada'
  };
  return map[status] || status;
};

const getBadgeClass = (status: BedStateName) => `badge-${status.toLowerCase()}`;
const getBorderClass = (status: BedStateName) => `border-${status.toLowerCase()}`;
</script>

<style scoped>
/* Paleta de colores basada en los mockups */
:root {
  --primary-teal: #0aa28a;
  --primary-blue: #2563eb;
  --bg-light: #f8fafc;
  --text-main: #1e293b;
  --text-muted: #64748b;
  
  --color-libre: #10b981;
  --color-ocupada: #ef4444;
  --color-limpieza: #f59e0b;
  --color-bloqueada: #94a3b8;
}

.beds-page { 
  max-width: 1200px; 
  margin: 0 auto; 
  padding: 20px;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #1e293b;
}

/* Header de la página */
.breadcrumb { font-size: 0.85rem; color: #94a3b8; font-weight: 500; }
.header-flex { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; }
.page-header h1 { margin: 0.3rem 0 0.2rem 0; font-size: 1.5rem; font-weight: 700; color: #0f172a; }
.page-header p { margin: 0; color: #64748b; font-size: 0.95rem; }

/* Barra de Leyenda */
/* Barra de Leyenda */
.legend-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  border: 1px solid #e2e8f0;
  margin-bottom: 2rem;
  width: max-content;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}
.legend-title { color: #64748b; font-size: 0.9rem; margin-right: 0.5rem; font-weight: 500; }
.legend-item { 
  display: flex; align-items: center; gap: 0.4rem; 
  font-size: 0.8rem; font-weight: 600; 
  padding: 0.3rem 0.8rem; border-radius: 20px; 
}
.capsule-libres { background-color: #ecfdf5; color: #059669; }
.capsule-ocupadas { background-color: #fef2f2; color: #dc2626; }
.capsule-limpieza { background-color: #fffbeb; color: #d97706; }
.capsule-bloqueadas { background-color: #f1f5f9; color: #475569; }

.dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-libres { background-color: #10b981; }
.dot-ocupadas { background-color: #ef4444; }
.dot-limpieza { background-color: #f59e0b; }
.dot-bloqueadas { background-color: #94a3b8; }

/* Grid de Tarjetas */
.beds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* Tarjeta individual */
.bed-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -1px rgba(0,0,0,0.02);
  border: 1px solid #e2e8f0;
  border-top: 4px solid transparent;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 200px;
}

.border-libres { border-top-color: #10b981; }
.border-ocupadas { border-top-color: #ef4444; }
.border-en_limpieza { border-top-color: #f59e0b; }
.border-bloqueadas { border-top-color: #94a3b8; }

.bed-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.room-badge { font-weight: 600; color: #94a3b8; font-size: 0.75rem; letter-spacing: 0.5px; }
.status-badge { padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.7rem; font-weight: 600; }

.badge-libres { background-color: #ecfdf5; color: #059669; }
.badge-ocupadas { background-color: #fef2f2; color: #dc2626; }
.badge-en_limpieza { background-color: #fffbeb; color: #d97706; }
.badge-bloqueadas { background-color: #f1f5f9; color: #475569; }

.bed-body h3 { margin: 0 0 1rem 0; color: #0f172a; font-size: 1.25rem; font-weight: 700; }

/* Info del Paciente con Avatar */
.patient-info { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
.patient-info.empty { color: #94a3b8; font-size: 0.9rem; height: 38px; }
.avatar { 
  width: 38px; height: 38px; 
  border-radius: 8px; 
  background-color: #f1f5f9; 
  color: #475569; 
  display: flex; align-items: center; justify-content: center; 
  font-weight: 700; font-size: 0.85rem; 
}
.patient-details { display: flex; flex-direction: column; }
.patient-details strong { font-size: 0.9rem; color: #1e293b; }
.patient-details span { font-size: 0.75rem; color: #64748b; }

/* Botones */
.bed-actions { margin-top: auto; }
.action-group { display: flex; gap: 0.5rem; }
.flex-grow { flex: 1; }
.full-width { width: 100%; }
.icon-only { padding: 0.5rem 0.75rem; }

.btn { 
  border: none; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; 
  font-size: 0.85rem; cursor: pointer; transition: all 0.2s; 
}
.btn-primary { background-color: #0aa28a; color: white; }
.btn-primary:hover { background-color: #088b76; }
.btn-teal { background-color: #0aa28a; color: white; }
.btn-teal:hover { background-color: #088b76; }
.btn-light { background-color: #f1f5f9; color: #475569; }
.btn-light:hover { background-color: #e2e8f0; color: #1e293b; }
.btn-pill { border-radius: 50px; padding: 0.5rem 1.25rem; }

/* Modales */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(2px); }
.modal-content { background: white; width: 90%; max-width: 500px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); overflow: hidden; }
.modal-sm { max-width: 400px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; }
.modal-header h2 { margin: 0; font-size: 1.1rem; color: #0f172a; font-weight: 700; }
.btn-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #94a3b8; }
.modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
.modal-body label { font-weight: 600; font-size: 0.85rem; color: #475569; }
.search-row { display: flex; gap: 0.5rem; }
.search-row input { flex: 1; padding: 0.6rem 1rem; border: 1px solid #e2e8f0; border-radius: 8px; outline: none; transition: border 0.2s; }
.search-row input:focus { border-color: #0aa28a; }
.patient-badge { background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 1rem; border-radius: 8px; display: flex; flex-direction: column; }
.patient-badge strong { color: #166534; font-size: 0.95rem; }
.patient-badge span { font-size: 0.8rem; color: #15803d; }
.modal-footer { padding: 1rem 1.5rem; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 0.75rem; }
.mt-1 { margin-top: 1rem; }
.alert { padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem; font-weight: 500; }
.alert-error { background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.alert-success { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
</style>