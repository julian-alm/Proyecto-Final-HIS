import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReceptionView from './ReceptionView.vue';

// Importamos el servicio real para poder interceptarlo
import { AdmissionService } from '../services/admission.service';

// 1. Aislamos el componente de dependencias externas (Principio Hermético)
// Reemplazamos el servicio real por un objeto simulado (Mock)
vi.mock('../services/admission.service', () => ({
    AdmissionService: {
        registerPatient: vi.fn()
    }
}));

describe('ReceptionView.vue', () => {
    beforeEach(() => {
        // Limpiamos el historial del mock antes de cada prueba para mantenerlas Independientes
        vi.clearAllMocks();
    });

    it('debe enviar el formulario, llamar al servicio y limpiar los campos al tener éxito', async () => {
        // 1. ARRANGE (Organizar)
        const wrapper = mount(ReceptionView);
        
        // Configuramos nuestro Mock para que devuelva una promesa exitosa simulando la respuesta del backend
        const mockResponse = { data: { patientId: { id: 'paciente-uuid-9999' } } };
        (AdmissionService.registerPatient as any).mockResolvedValue(mockResponse);

        // 2. ACT (Actuar)
        // Interactuamos con el sistema exactamente de la misma manera que lo haría un usuario real[cite: 8]
        const inputs = wrapper.findAll('input[type="text"]');
        
        // Llenamos los inputs de texto (0: DNI, 1: Nombre, 2: Apellido)
        await inputs[0].setValue('12345678'); 
        await inputs[1].setValue('Ramiro');     
        await inputs[2].setValue('Pérez');    
        
        // Seleccionamos la cobertura
        await wrapper.find('select').setValue('PUBLIC');

        // Disparamos el botón de submit del formulario
        await wrapper.find('form').trigger('submit');

        // Como handleRegisterPatient es async, forzamos a Vitest a esperar que las promesas terminen
        await flushPromises();

        // 3. ASSERT (Afirmar)
        // Verificamos que el componente se comunicó correctamente con el servicio externo enviando el objeto esperado
        expect(AdmissionService.registerPatient).toHaveBeenCalledWith({
            dni: '12345678',
            firstName: 'Ramiro',
            lastName: 'Pérez',
            coverageType: 'PUBLIC'
        });
        expect(AdmissionService.registerPatient).toHaveBeenCalledTimes(1);

        // Verificamos el cambio de estado (Blackbox Testing): los inputs deben haberse vaciado tras el éxito[cite: 8]
        expect((inputs[0].element as HTMLInputElement).value).toBe('');
        expect((inputs[1].element as HTMLInputElement).value).toBe('');
        
        // Verificamos que el ToastAlert se disparó mostrando el ID simulado en el DOM
        expect(wrapper.html()).toContain('Paciente registrado con éxito. ID: paciente-uuid-9999');
    });

    it('debe mostrar un mensaje de error si falla la llamada al backend', async () => {
        // 1. ARRANGE (Organizar)
        const wrapper = mount(ReceptionView);
        
        // Simulamos que el backend arroja un error (ej. DNI duplicado o servidor caído)
        (AdmissionService.registerPatient as any).mockRejectedValue(new Error('Error de red'));

        // 2. ACT (Actuar)
        const inputs = wrapper.findAll('input[type="text"]');
        await inputs[0].setValue('12345678'); 
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // 3. ASSERT (Afirmar)
        // El formulario NO debe vaciarse si hubo un error para que el usuario pueda corregirlo
        expect((inputs[0].element as HTMLInputElement).value).toBe('12345678');
        
        // El ToastAlert debe mostrar el mensaje de error definido en el bloque catch
        expect(wrapper.html()).toContain('Hubo un error al registrar al paciente');
    });
});