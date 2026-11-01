<template>
  <div class="inventory-page">
    <div class="page-header">
      <span class="breadcrumb">Operación / Inventario y Stock</span>
      <h1>Gestión de Inventario</h1>
      <p>Control de stock, registro de ingresos (compras) y egresos (consumos)</p>
    </div>

    <div class="inventory-grid">
      <!-- PANEL IZQUIERDO: Registrar Movimiento -->
      <section class="card form-card">
        <h2>Registrar movimiento</h2>
        <form @submit.prevent="handleRegisterMovement" class="mt-1 form-layout">
          <div class="form-group">
            <label>Tipo de movimiento</label>
            <div class="radio-group">
              <label class="radio-label input-in">
                <input type="radio" v-model="form.type" value="INGRESO" required />
                <span>Ingreso (Suma)</span>
              </label>
              <label class="radio-label input-out">
                <input type="radio" v-model="form.type" value="EGRESO" required />
                <span>Egreso (Resta)</span>
              </label>
            </div>
          </div>

          <div class="form-group mt-1">
            <label>Nombre exacto del insumo</label>
            <input v-model.trim="form.medicationName" type="text" placeholder="Ej. Ibuprofeno 400mg" required :disabled="isLoading"/>
          </div>

          <div class="form-row mt-1">
            <div class="form-group">
              <label>Cantidad</label>
              <input v-model.number="form.quantity" type="number" min="1" placeholder="Ej. 50" required :disabled="isLoading"/>
            </div>
            <div class="form-group">
              <label>Motivo / Observación</label>
              <input v-model.trim="form.reason" type="text" placeholder="Ej. Compra a proveedor" required :disabled="isLoading"/>
            </div>
          </div>

          <div v-if="errorMessage" class="alert alert-error mt-1">{{ errorMessage }}</div>
          <div v-if="successMessage" class="alert alert-success mt-1">{{ successMessage }}</div>

          <button type="submit" class="btn btn-teal mt-2" :disabled="isLoading">
            {{ isLoading ? 'Registrando...' : 'Confirmar movimiento' }}
          </button>
        </form>
      </section>

      <!-- PANEL DERECHO: Pestañas de Historial y Stock -->
      <section class="card list-card">
        <div class="tabs-header">
          <button class="tab-btn" :class="{ active: activeTab === 'HISTORY' }" @click="activeTab = 'HISTORY'">
            Últimos movimientos
          </button>
          <button class="tab-btn" :class="{ active: activeTab === 'STOCK' }" @click="activeTab = 'STOCK'">
            Stock Consolidado
          </button>
        </div>

        <div v-if="isLoadingData" class="loading-state">Cargando registros...</div>
        
        <div v-else class="table-responsive mt-1">
          <!-- TABLA 1: Historial -->
          <table class="clean-table" v-if="activeTab === 'HISTORY'">
            <thead>
              <tr>
                <th>FECHA</th>
                <th>INSUMO</th>
                <th>CANT.</th>
                <th>MOTIVO</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mov in movements" :key="mov.id">
                <td class="text-muted">{{ new Date(mov.createdAt).toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'}) }}</td>
                <td class="fw-600">{{ mov.medicationName }}</td>
                <td>
                  <span class="badge" :class="mov.type === 'INGRESO' ? 'badge-in' : 'badge-out'">
                    {{ mov.type === 'INGRESO' ? '+' : '-' }}{{ mov.quantity }}
                  </span>
                </td>
                <td class="text-muted text-small">{{ mov.reason }}</td>
              </tr>
              <tr v-if="movements.length === 0">
                <td colspan="4" class="text-center text-muted py-2">No hay movimientos registrados.</td>
              </tr>
            </tbody>
          </table>

          <!-- TABLA 2: Stock Actual -->
          <table class="clean-table" v-if="activeTab === 'STOCK'">
            <thead>
              <tr>
                <th>INSUMO / MEDICAMENTO</th>
                <th>STOCK ACTUAL</th>
                <th>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in currentStockList" :key="item.medicationName">
                <td class="fw-600">{{ item.medicationName }}</td>
                <td class="fw-700">{{ item.currentStock }} unid.</td>
                <td>
                  <span class="status-indicator">
                    <div class="dot" :class="item.currentStock > 10 ? 'dot-active' : (item.currentStock > 0 ? 'dot-warning' : 'dot-inactive')"></div>
                    {{ item.currentStock > 10 ? 'Óptimo' : (item.currentStock > 0 ? 'Bajo' : 'Sin stock') }}
                  </span>
                </td>
              </tr>
              <tr v-if="currentStockList.length === 0">
                <td colspan="3" class="text-center text-muted py-2">No hay stock registrado.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { apiClient } from '../../../core/api/axios.client';

const form = reactive({
  medicationName: '',
  quantity: 1,
  type: 'INGRESO',
  reason: ''
});

const activeTab = ref<'HISTORY' | 'STOCK'>('HISTORY');
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const movements = ref<any[]>([]);
const currentStockList = ref<any[]>([]);
const isLoadingData = ref(false);

const fetchData = async () => {
  isLoadingData.value = true;
  try {
    if (activeTab.value === 'HISTORY') {
      const res = await apiClient.get('/inventory/movements');
      movements.value = res.data;
    } else {
      const res = await apiClient.get('/inventory/stock');
      currentStockList.value = res.data;
    }
  } catch (error) {
    console.error(error);
  } finally {
    isLoadingData.value = false;
  }
};

watch(activeTab, () => fetchData());
onMounted(() => fetchData());

const handleRegisterMovement = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  isLoading.value = true;

  try {
    await apiClient.post('/inventory/movements', form);
    successMessage.value = 'Movimiento registrado con éxito.';
    form.quantity = 1;
    form.reason = '';
    
    await fetchData();
    setTimeout(() => successMessage.value = '', 4000);
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Error al registrar el movimiento.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.inventory-page { max-width: 1200px; margin: 0 auto; font-family: 'Inter', system-ui, sans-serif; color: #0f172a; }
.breadcrumb { font-size: 0.8rem; color: #94a3b8; font-weight: 500; display: block; margin-bottom: 0.25rem; }
.page-header { margin-bottom: 2rem; }
.page-header h1 { margin: 0 0 0.2rem 0; font-size: 1.4rem; font-weight: 700; color: #0f172a; }
.page-header p { margin: 0; color: #64748b; font-size: 0.9rem; }

.inventory-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
@media (min-width: 1024px) { .inventory-grid { grid-template-columns: 1fr 1.3fr; align-items: start; } }

.card { background: #ffffff; padding: 1.75rem; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
.card h2 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #0f172a; }

.form-layout { display: flex; flex-direction: column; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-group label { font-size: 0.85rem; font-weight: 600; color: #334155; }

input { padding: 0.7rem 1rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; outline: none; transition: border-color 0.2s; }
input:focus { border-color: #0aa28a; box-shadow: 0 0 0 3px rgba(10,162,138,0.1); }
input:disabled { background-color: #f8fafc; color: #94a3b8; }

.radio-group { display: flex; gap: 1rem; }
.radio-label { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.6rem 1rem; border: 1px solid #cbd5e1; border-radius: 8px; cursor: pointer; flex: 1; font-size: 0.85rem; font-weight: 600; transition: all 0.2s; }
.radio-label input { display: none; }
.radio-label:has(input:checked).input-in { background-color: #f0fdf4; border-color: #10b981; color: #047857; }
.radio-label:has(input:checked).input-out { background-color: #fef2f2; border-color: #ef4444; color: #b91c1c; }

.btn { border: none; padding: 0.8rem 1rem; border-radius: 8px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: background-color 0.2s; width: 100%; }
.btn-teal { background-color: #0aa28a; color: white; }
.btn-teal:hover:not(:disabled) { background-color: #088b76; }
.btn-teal:disabled { background-color: #cbd5e1; cursor: not-allowed; }

.mt-1 { margin-top: 1rem; } .mt-2 { margin-top: 1.5rem; }
.alert { padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 500; }
.alert-error { background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.alert-success { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }

/* Tabs */
.tabs-header { display: flex; gap: 1.5rem; border-bottom: 2px solid #f1f5f9; margin-bottom: 1rem; padding-bottom: 0.5rem; }
.tab-btn { background: none; border: none; font-size: 1rem; font-weight: 600; color: #94a3b8; cursor: pointer; padding: 0.5rem 0; position: relative; transition: color 0.2s; }
.tab-btn:hover { color: #334155; }
.tab-btn.active { color: #0aa28a; }
.tab-btn.active::after { content: ''; position: absolute; bottom: -0.65rem; left: 0; width: 100%; height: 2px; background-color: #0aa28a; border-radius: 2px; }

.table-responsive { overflow-x: auto; }
.clean-table { width: 100%; border-collapse: collapse; }
.clean-table th, .clean-table td { padding: 1rem 0.5rem; text-align: left; border-bottom: 1px solid #f1f5f9; }
.clean-table th { color: #94a3b8; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; }
.fw-600 { font-weight: 600; color: #0f172a; }
.fw-700 { font-weight: 700; color: #0f172a; }
.text-muted { color: #64748b; font-size: 0.85rem; }
.text-small { font-size: 0.8rem; }
.text-center { text-align: center; }
.py-2 { padding: 2rem 0; }
.loading-state { text-align: center; padding: 2rem; color: #64748b; }

.badge { padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.8rem; font-weight: 700; font-family: monospace; }
.badge-in { background-color: #d1fae5; color: #047857; }
.badge-out { background-color: #fee2e2; color: #b91c1c; }

/* Status Indicators */
.status-indicator { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; font-weight: 500; color: #334155; }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-active { background-color: #10b981; }
.dot-warning { background-color: #f59e0b; }
.dot-inactive { background-color: #ef4444; }
</style>