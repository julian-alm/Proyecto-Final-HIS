import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import InventoryView from './InventoryView.vue';
import { apiClient } from '../../../core/api/axios.client';

// Mockeamos Axios para que no dispare peticiones reales a NestJS
vi.mock('../../../core/api/axios.client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

describe('InventoryView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería cargar y renderizar el historial de movimientos al montarse', async () => {
    // ARRANGE: Simulamos la respuesta del backend para el historial
    (apiClient.get as any).mockResolvedValue({
      data: [
        { id: 1, medicationName: 'Ibuprofeno 400mg', type: 'INGRESO', quantity: 50, reason: 'Compra al proveedor', createdAt: '2026-11-14T10:00:00Z' }
      ]
    });

    // ACT: Montamos el componente
    const wrapper = mount(InventoryView);
    await flushPromises(); // Esperamos a que se resuelvan las promesas del onMounted

    // ASSERT: Verificamos que llamó al endpoint correcto y pintó la tabla
    expect(apiClient.get).toHaveBeenCalledWith('/inventory/movements');
    expect(wrapper.text()).toContain('Ibuprofeno 400mg');
    expect(wrapper.text()).toContain('+50');
    expect(wrapper.text()).toContain('Compra al proveedor');
  });

  it('debería cambiar a la pestaña de Stock y pedir los datos consolidados', async () => {
    // ARRANGE: Simulamos ambas respuestas (la primera del onMounted, la segunda del clic)
    (apiClient.get as any).mockResolvedValueOnce({ data: [] }); 
    (apiClient.get as any).mockResolvedValueOnce({
      data: [{ medicationName: 'Paracetamol 500mg', currentStock: 15 }]
    }); 

    const wrapper = mount(InventoryView);
    await flushPromises();

    // ACT: Hacemos clic en la pestaña "Stock Consolidado" (el segundo botón)
    const tabs = wrapper.findAll('.tab-btn');
    await tabs[1].trigger('click');
    await flushPromises(); // Esperamos al watch() y la petición Axios

    // ASSERT: Verificamos que cambió de endpoint y actualizó la tabla
    expect(apiClient.get).toHaveBeenCalledWith('/inventory/stock');
    expect(wrapper.text()).toContain('Paracetamol 500mg');
    expect(wrapper.text()).toContain('15 unid.');
    expect(wrapper.text()).toContain('Óptimo'); // Verifica la lógica de los dots visuales
  });

  it('debería registrar un nuevo movimiento enviando el formulario', async () => {
    // ARRANGE
    (apiClient.get as any).mockResolvedValue({ data: [] });
    (apiClient.post as any).mockResolvedValue({ data: { success: true } });

    const wrapper = mount(InventoryView);
    await flushPromises();

    // ACT: Llenamos los inputs del formulario simulando escritura real
    await wrapper.find('input[placeholder="Ej. Ibuprofeno 400mg"]').setValue('Amoxicilina');
    await wrapper.find('input[placeholder="Ej. 50"]').setValue(20);
    await wrapper.find('input[placeholder="Ej. Compra a proveedor"]').setValue('Ajuste manual');
    
    // Dejamos el tipo en 'INGRESO' (que es el default) y enviamos el form
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    // ASSERT: Verificamos que se haya enviado el payload correcto al backend
    expect(apiClient.post).toHaveBeenCalledWith('/inventory/movements', {
      medicationName: 'Amoxicilina',
      quantity: 20,
      type: 'INGRESO',
      reason: 'Ajuste manual'
    });
    
    // Verificamos que el mensaje de éxito aparezca en pantalla
    expect(wrapper.text()).toContain('Movimiento registrado con éxito.');
  });
});