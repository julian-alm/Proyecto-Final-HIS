import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import BedManagementView from './BedManagementView.vue';
import { bedService } from '../services/bed-management.service';

// 1. Mockeamos el servicio de camas entero
vi.mock('../services/bed-management.service', () => ({
  bedService: {
    getBeds: vi.fn(),
    findPatientByDni: vi.fn(),
    assignBed: vi.fn(),
    dischargeBed: vi.fn(),
    cleanBed: vi.fn(),
    blockBed: vi.fn(),
    unblockBed: vi.fn(),
  }
}));

// 2. Mockeamos el Store DIRECTAMENTE sin instalar @pinia/testing
vi.mock('../../iam/store/auth.store', () => ({
  useAuthStore: vi.fn(() => ({
    userRole: 'ADMIN' // Forzamos que sea ADMIN para ver todos los botones
  }))
}));

describe('BedManagementView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería cargar y mostrar las camas con sus estados correctos al montarse', async () => {
    // ARRANGE: Simulamos dos camas
    (bedService.getBeds as any).mockResolvedValue([
      { id: '1', roomNumber: '101', status: 'LIBRES' },
      { 
        id: '2', 
        roomNumber: '102', 
        status: 'OCUPADAS', 
        patientId: 'uuid-paciente-123', // <-- AGREGAMOS ESTO
        patientFullName: 'Mariano López', 
        patientDni: '12345678' 
      }
    ]);

    // ACT: Montamos normal, sin configuraciones extra de Pinia
    const wrapper = mount(BedManagementView);
    await flushPromises();

    // ASSERT: Verificamos que se rendericen correctamente
    expect(bedService.getBeds).toHaveBeenCalled();
    expect(wrapper.text()).toContain('HAB. 101');
    expect(wrapper.text()).toContain('Disponible'); 
    expect(wrapper.text()).toContain('HAB. 102');
    expect(wrapper.text()).toContain('Ocupada');
    expect(wrapper.text()).toContain('Mariano López');
  });

  it('debería permitir a un Admin buscar un paciente por DNI y asignarlo a una cama libre', async () => {
    // ARRANGE
    (bedService.getBeds as any).mockResolvedValue([{ id: 'uuid-bed-1', roomNumber: '201', status: 'LIBRES' }]);
    (bedService.findPatientByDni as any).mockResolvedValue({
      id: 'uuid-patient', firstName: 'Carlos', lastName: 'García', dni: '30112455'
    });
    (bedService.assignBed as any).mockResolvedValue({});

    const wrapper = mount(BedManagementView);
    await flushPromises();

    // ACT: 1. Clic en "Ingresar"
    await wrapper.find('.action-group .btn-teal').trigger('click');
    
    // 2. Buscar paciente
    await wrapper.find('input[placeholder="Ej. 30.112.455"]').setValue('30112455');
    await wrapper.find('.search-row .btn-teal').trigger('click');
    await flushPromises();

    // 3. Confirmar ingreso
    await wrapper.find('.modal-footer .btn-primary').trigger('click');
    await flushPromises();

    // ASSERT
    expect(bedService.findPatientByDni).toHaveBeenCalledWith('30112455');
    expect(bedService.assignBed).toHaveBeenCalledWith('uuid-bed-1', 'uuid-patient');
    expect(wrapper.text()).toContain('Paciente ingresado exitosamente.');
  });

  it('debería permitir procesar el alta y cambiar el estado a "EN_LIMPIEZA"', async () => {
    // ARRANGE
    (bedService.getBeds as any).mockResolvedValue([
      { id: 'uuid-bed-2', roomNumber: '305', status: 'OCUPADAS', patientFullName: 'Laura', patientDni: '11111111' }
    ]);
    (bedService.dischargeBed as any).mockResolvedValue({});

    const wrapper = mount(BedManagementView);
    await flushPromises();

    // ACT: 1. Clic en "Procesar Alta"
    await wrapper.find('.bed-actions .btn-light').trigger('click');
    
    // 2. Clic en "Confirmar"
    await wrapper.find('.modal-footer .btn-primary').trigger('click');
    await flushPromises();

    // ASSERT
    expect(bedService.dischargeBed).toHaveBeenCalledWith('uuid-bed-2');
    expect(wrapper.text()).toContain('Alta procesada');
    expect(bedService.getBeds).toHaveBeenCalledTimes(2); 
  });
});