import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import InventoryView from './InventoryView.vue';
import { apiClient } from '../../../core/api/axios.client';

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
    // ARRANGE
    (apiClient.get as any).mockResolvedValue({
      data: [
        { id: 1, medicationName: 'Ibuprofeno 400mg', type: 'INGRESO', quantity: 50, reason: 'Compra al proveedor', createdAt: '2026-11-14T10:00:00Z' }
      ]
    });

    // ACT
    const wrapper = mount(InventoryView);
    await flushPromises();

    // ASSERT
    expect(apiClient.get).toHaveBeenCalledWith('/inventory/movements');
    expect(wrapper.text()).toContain('Ibuprofeno 400mg');
    expect(wrapper.text()).toContain('+50');
    expect(wrapper.text()).toContain('Compra al proveedor');
  });

  it('debería cambiar a la pestaña de Stock y pedir los datos consolidados', async () => {
    // ARRANGE
    (apiClient.get as any).mockResolvedValueOnce({ data: [] }); 
    (apiClient.get as any).mockResolvedValueOnce({
      data: [{ medicationName: 'Paracetamol 500mg', currentStock: 15 }]
    }); 

    const wrapper = mount(InventoryView);
    await flushPromises();

    // ACT
    const tabs = wrapper.findAll('.tab-btn');
    await tabs[1].trigger('click');
    await flushPromises();

    // ASSERT
    expect(apiClient.get).toHaveBeenCalledWith('/inventory/stock');
    expect(wrapper.text()).toContain('Paracetamol 500mg');
    expect(wrapper.text()).toContain('15 unid.');
    expect(wrapper.text()).toContain('Óptimo');
  });

  it('debería registrar un nuevo movimiento enviando el formulario', async () => {
    // ARRANGE
    (apiClient.get as any).mockResolvedValue({ data: [] });
    (apiClient.post as any).mockResolvedValue({ data: { success: true } });

    const wrapper = mount(InventoryView);
    await flushPromises();

    // ACT
    await wrapper.find('input[placeholder="Ej. Ibuprofeno 400mg"]').setValue('Amoxicilina');
    await wrapper.find('input[placeholder="Ej. 50"]').setValue(20);
    await wrapper.find('input[placeholder="Ej. Compra a proveedor"]').setValue('Ajuste manual');
    
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    // ASSERT
    expect(apiClient.post).toHaveBeenCalledWith('/inventory/movements', {
      medicationName: 'Amoxicilina',
      quantity: 20,
      type: 'INGRESO',
      reason: 'Ajuste manual'
    });
    
    expect(wrapper.text()).toContain('Movimiento registrado con éxito.');
  });
});