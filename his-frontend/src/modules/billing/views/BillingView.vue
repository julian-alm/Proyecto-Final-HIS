<template>
  <div class="billing-page">
    <div class="page-header">
      <span class="breadcrumb">Operación / Facturación</span>
      <h1>Módulo de Facturación y Aranceles</h1>
      <p>Generación de cargos y gestión de la lista de precios</p>
    </div>

    <div class="billing-grid">
      <!-- PANEL 1: Calcular Costo de Consulta -->
      <section class="card">
        <h2>Facturar consulta médica</h2>

        <!-- Paso 1: Buscador de Paciente por DNI -->
        <div class="form-group">
          <label>Buscar paciente por DNI</label>
          <div class="search-row">
            <input
              v-model.trim="dniQuery"
              type="text"
              placeholder="Ej. 30.112.455"
              @keyup.enter="handleSearchPatient"
              :disabled="searchingPatient"
            />
            <!-- El botón de búsqueda está integrado en el campo si hay texto, si no, se usa enter -->
          </div>
        </div>

        <div v-if="selectedPatient" class="patient-badge">
          <div>
            <strong>{{ selectedPatient.firstName }} {{ selectedPatient.lastName }}</strong>
            <span>DNI: {{ selectedPatient.dni }} • {{ selectedPatient.coverageType }}</span>
          </div>
          <button type="button" class="btn-text" @click="clearPatient">Cambiar</button>
        </div>

        <!-- Paso 2: Formulario de Liquidación -->
        <form @submit.prevent="handleCalculate" class="form-layout mt-1">
          <div class="form-row">
            <div class="form-group">
              <label>Cobertura</label>
              <select
                v-model="billForm.coverageType"
                required
                :disabled="loadingBill || !selectedPatient"
              >
                <option value="PRIVATE">Particular</option>
                <option value="PREPAID">Obra Social / Prepaga</option>
                <option value="PUBLIC">Pública</option>
              </select>
            </div>

            <div class="form-group">
              <label>Costo base</label>
              <div class="input-prefix">
                <span class="prefix">$</span>
                <input
                  v-model.number="billForm.consultationBaseCost"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  :disabled="loadingBill || !selectedPatient"
                />
              </div>
            </div>
          </div>

          <div v-if="billError" class="alert alert-error">{{ billError }}</div>

          <button
            type="submit"
            class="btn btn-teal mt-1"
            :disabled="loadingBill || !selectedPatient"
          >
            {{ loadingBill ? 'Procesando...' : 'Generar cargo de consulta' }}
          </button>
        </form>

        <BillResultCard
          v-if="lastCalculation"
          :result="lastCalculation"
          @clear="lastCalculation = null"
          class="mt-1"
        />
      </section>

      <!-- PANEL 2: ABM de Lista de Precios -->
      <section class="card">
        <h2>Actualizar precio de insumo</h2>

        <form @submit.prevent="handleSavePrice" class="form-layout mt-1">
          <div class="form-group">
            <label>Nombre del insumo</label>
            <input
              v-model.trim="priceForm.itemName"
              type="text"
              placeholder="Ej. Suero fisiológico 500ml"
              required
              :disabled="loadingPrice"
            />
          </div>

          <div class="form-group">
            <label>Precio unitario</label>
            <div class="input-prefix">
              <span class="prefix">$</span>
              <input
                v-model.number="priceForm.unitPrice"
                type="number"
                min="0"
                step="0.01"
                required
                :disabled="loadingPrice"
              />
            </div>
          </div>

          <div v-if="priceError" class="alert alert-error">{{ priceError }}</div>
          <div v-if="priceSuccess" class="alert alert-success">{{ priceSuccess }}</div>

          <button type="submit" class="btn btn-blue mt-auto" :disabled="loadingPrice">
            {{ loadingPrice ? 'Guardando...' : 'Guardar en lista de precios' }}
          </button>
        </form>
      </section>
    </div>

    <!-- TABLAS DE DATOS EN VIVO -->
    <div v-if="loadingData" class="loading-state">Cargando datos del servidor...</div>
    
    <div v-else class="tables-grid">
      <!-- Tabla de Cargos -->
      <div class="card table-card">
        <h3>Últimos cargos generados</h3>
        <div class="table-responsive">
          <table class="clean-table">
            <thead>
              <tr>
                <th>FECHA</th>
                <th>CONCEPTO</th>
                <th>ID PAC.</th>
                <th>ABONA PAC.</th>
                <th>CUBRE OS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="charge in chargesList" :key="charge.id">
                <td>{{ new Date(charge.createdAt).toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'}) }}</td>
                <td class="fw-500">{{ charge.concept }}</td>
                <td class="text-muted fw-600">{{ charge.patientId.substring(0,8) }}</td>
                <td class="fw-700">${{ charge.patientAmount.toLocaleString('es-AR') }}</td>
                <td class="fw-700">${{ charge.thirdPartyAmount.toLocaleString('es-AR') }}</td>
              </tr>
              <tr v-if="chargesList.length === 0">
                <td colspan="5" class="text-center text-muted py-2">No hay cargos registrados.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tabla de Precios -->
      <div class="card table-card">
        <h3>Lista de precios vigente</h3>
        <div class="table-responsive">
          <table class="clean-table">
            <thead>
              <tr>
                <th>INSUMO</th>
                <th>PRECIO</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in pricesList" :key="item.id || item.itemName">
                <td class="fw-500">{{ item.itemName }}</td>
                <td class="fw-700">${{ item.unitPrice.toLocaleString('es-AR') }}</td>
              </tr>
              <tr v-if="pricesList.length === 0">
                <td colspan="2" class="text-center text-muted py-2">Sin precios configurados.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, watch } from 'vue';
import { billingService } from '../services/billing.service';
import BillResultCard from '../components/BillResultCard.vue';
import type {
  BillingCoverageType,
  GenerateBillPayload,
  CreatePricePayload,
  BillCalculationResponse,
  PatientLookup,
  ChargeItem,
  PriceItemResponse
} from '../types/billing.types';

// Estado de búsqueda de paciente
const dniQuery = ref('');
const searchingPatient = ref(false);
const selectedPatient = ref<PatientLookup | null>(null);

// Disparar búsqueda al terminar de tipear 8 números (Mejora UX)
watch(dniQuery, (newVal) => {
  if (newVal.length >= 8 && !searchingPatient.value) {
    handleSearchPatient();
  }
});

// Estado del formulario de Facturación
const billForm = reactive<GenerateBillPayload>({
  patientId: '',
  coverageType: 'PRIVATE',
  consultationBaseCost: 15000,
});

const loadingBill = ref(false);
const billError = ref('');
const lastCalculation = ref<BillCalculationResponse | null>(null);

// Estado del formulario de Lista de Precios
const priceForm = reactive<CreatePricePayload>({
  itemName: '',
  unitPrice: 0,
});

const loadingPrice = ref(false);
const priceError = ref('');
const priceSuccess = ref('');

// Estado de Tablas en vivo
const pricesList = ref<PriceItemResponse['item'][]>([]);
const chargesList = ref<ChargeItem[]>([]);
const loadingData = ref(false);

const loadDashboardData = async () => {
  loadingData.value = true;
  try {
    const [prices, charges] = await Promise.all([
      billingService.getPrices(),
      billingService.getCharges()
    ]);
    pricesList.value = prices;
    chargesList.value = charges;
  } catch (error) {
    console.error('Error cargando datos', error);
  } finally {
    loadingData.value = false;
  }
};

onMounted(() => loadDashboardData());

const normalizeCoverage = (raw: string): BillingCoverageType => {
  const upper = (raw || '').toUpperCase().trim();
  if (upper === 'PUBLIC' || upper === 'PUBLICA' || upper === 'PÚBLICA') return 'PUBLIC';
  if (upper === 'PREPAID' || upper === 'PREPAGA' || upper === 'OBRA_SOCIAL') return 'PREPAID';
  return 'PRIVATE';
};

const handleSearchPatient = async () => {
  if (!dniQuery.value) return;
  billError.value = '';
  lastCalculation.value = null;

  try {
    searchingPatient.value = true;
    const patient = await billingService.findPatientByDni(dniQuery.value);
    selectedPatient.value = patient;
    billForm.patientId = patient.id;
    billForm.coverageType = normalizeCoverage(patient.coverageType);
  } catch (error: any) {
    selectedPatient.value = null;
    billForm.patientId = '';
    billError.value = 'Paciente no encontrado.';
  } finally {
    searchingPatient.value = false;
  }
};

const clearPatient = () => {
  selectedPatient.value = null;
  billForm.patientId = '';
  dniQuery.value = '';
  lastCalculation.value = null;
};

const handleCalculate = async () => {
  if (!selectedPatient.value) return;
  billError.value = '';
  lastCalculation.value = null;

  try {
    loadingBill.value = true;
    const response = await billingService.calculateConsultation({ ...billForm });
    lastCalculation.value = {
      ...response,
      patientId: selectedPatient.value.id,
      patientFullName: `${selectedPatient.value.firstName} ${selectedPatient.value.lastName}`,
      patientDni: selectedPatient.value.dni,
      coverageType: billForm.coverageType,
    };
    await loadDashboardData();
  } catch (error: any) {
    billError.value = 'Error al generar el cargo.';
  } finally {
    loadingBill.value = false;
  }
};

const handleSavePrice = async () => {
  priceError.value = '';
  priceSuccess.value = '';

  try {
    loadingPrice.value = true;
    await billingService.savePrice({ ...priceForm });
    priceSuccess.value = 'Guardado correctamente.';
    priceForm.itemName = '';
    priceForm.unitPrice = 0;
    await loadDashboardData();
    setTimeout(() => priceSuccess.value = '', 3000);
  } catch (error: any) {
    priceError.value = 'Error al guardar precio.';
  } finally {
    loadingPrice.value = false;
  }
};
</script>

<style scoped>
/* Tipografía y layout general */
.billing-page {
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #0f172a;
  padding-bottom: 2rem;
}

.breadcrumb { font-size: 0.8rem; color: #94a3b8; font-weight: 500; display: block; margin-bottom: 0.25rem; }
.page-header { margin-bottom: 1.5rem; }
.page-header h1 { margin: 0 0 0.2rem 0; font-size: 1.4rem; font-weight: 700; color: #0f172a; }
.page-header p { margin: 0; color: #64748b; font-size: 0.9rem; }

/* Grid Superior */
.billing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

/* Tarjetas (Cards) */
.card {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
}

.card h2, .card h3 {
  margin: 0 0 1.25rem 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

/* Formularios modernos */
.form-layout { display: flex; flex-direction: column; gap: 1rem; flex: 1; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-group label { font-size: 0.8rem; font-weight: 600; color: #334155; }

input, select {
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #334155;
  outline: none;
  transition: border-color 0.2s;
  background-color: white;
}
input:focus, select:focus { border-color: #3b82f6; }
input:disabled, select:disabled { background-color: #f8fafc; color: #94a3b8; }

/* Inputs con prefijo ($) */
.input-prefix {
  display: flex;
  align-items: center;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background-color: white;
  overflow: hidden;
}
.input-prefix:focus-within { border-color: #3b82f6; }
.prefix { padding-left: 0.75rem; color: #64748b; font-weight: 500; font-size: 0.9rem; }
.input-prefix input { border: none; padding-left: 0.4rem; width: 100%; border-radius: 0; }
.input-prefix input:focus { border: none; }

/* Búsqueda y Paciente */
.search-row { display: flex; width: 100%; }
.search-row input { width: 100%; }

.patient-badge {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-top: 0.5rem;
}
.patient-badge strong { display: block; color: #0f172a; font-size: 0.9rem; margin-bottom: 0.2rem;}
.patient-badge span { font-size: 0.75rem; color: #64748b; font-weight: 500;}
.btn-text { background: none; border: none; color: #3b82f6; cursor: pointer; font-weight: 600; font-size: 0.8rem; }

/* Botones */
.btn {
  border: none;
  padding: 0.65rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
}
.btn-teal { background-color: #0aa28a; color: white; }
.btn-teal:hover { background-color: #088b76; }
.btn-blue { background-color: #3b82f6; color: white; }
.btn-blue:hover { background-color: #2563eb; }
.btn:disabled { background-color: #cbd5e1; cursor: not-allowed; }

/* Utilidades */
.mt-1 { margin-top: 1rem; }
.mt-auto { margin-top: auto; }
.py-2 { padding-top: 2rem !important; padding-bottom: 2rem !important; }

/* Alertas */
.alert { padding: 0.6rem; border-radius: 6px; font-size: 0.8rem; font-weight: 500; }
.alert-error { background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.alert-success { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
.loading-state { text-align: center; color: #64748b; padding: 2rem; font-size: 0.9rem;}

/* --- TABLAS (Estilo Moderno) --- */
.tables-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .tables-grid { grid-template-columns: 2fr 1fr; }
}

.table-card { padding: 1.25rem 0 0 0; }
.table-card h3 { padding: 0 1.5rem; margin-bottom: 1rem; }
.table-responsive { overflow-x: auto; width: 100%; }

.clean-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.clean-table th, .clean-table td {
  padding: 0.85rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

.clean-table th {
  color: #94a3b8;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background-color: transparent;
}

.clean-table tbody tr:last-child td { border-bottom: none; }

/* Clases tipográficas para tablas */
.fw-500 { font-weight: 500; color: #334155; }
.fw-600 { font-weight: 600; }
.fw-700 { font-weight: 700; color: #0f172a; }
.text-muted { color: #64748b; }
.text-center { text-align: center; }
</style>