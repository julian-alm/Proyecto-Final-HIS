import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReceptionView from './ReceptionView.vue';

import { AdmissionService } from '../services/admission.service';

vi.mock('../services/admission.service', () => ({
    AdmissionService: {
        registerPatient: vi.fn()
    }
}));

describe('ReceptionView.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe enviar el formulario, llamar al servicio y limpiar los campos al tener éxito', async () => {
        // 1. ARRANGE (Organizar)
        const wrapper = mount(ReceptionView);

        const mockResponse = { data: { patientId: { id: 'paciente-uuid-9999' } } };
        (AdmissionService.registerPatient as any).mockResolvedValue(mockResponse);

        // 2. ACT (Actuar)
        const inputs = wrapper.findAll('input[type="text"]');

        await inputs[0].setValue('12345678'); 
        await inputs[1].setValue('Ramiro');     
        await inputs[2].setValue('Pérez');    
        await wrapper.find('select').setValue('PUBLIC');

        await wrapper.find('form').trigger('submit');

        await flushPromises();

        // 3. ASSERT (Afirmar)
        expect(AdmissionService.registerPatient).toHaveBeenCalledWith({
            dni: '12345678',
            firstName: 'Ramiro',
            lastName: 'Pérez',
            coverageType: 'PUBLIC'
        });
        expect(AdmissionService.registerPatient).toHaveBeenCalledTimes(1);
        expect((inputs[0].element as HTMLInputElement).value).toBe('');
        expect((inputs[1].element as HTMLInputElement).value).toBe('');

        expect(wrapper.html()).toContain('Paciente registrado con éxito. ID: paciente-uuid-9999');
    });

    it('debe mostrar un mensaje de error si falla la llamada al backend', async () => {
        // 1. ARRANGE (Organizar)
        const wrapper = mount(ReceptionView);

        (AdmissionService.registerPatient as any).mockRejectedValue(new Error('Error de red'));

        // 2. ACT (Actuar)
        const inputs = wrapper.findAll('input[type="text"]');
        await inputs[0].setValue('12345678'); 
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // 3. ASSERT (Afirmar)
        expect((inputs[0].element as HTMLInputElement).value).toBe('12345678');

        expect(wrapper.html()).toContain('Hubo un error al registrar al paciente');
    });
});