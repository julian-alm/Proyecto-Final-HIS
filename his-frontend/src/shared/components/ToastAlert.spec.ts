import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue'; // Importamos la utilidad para esperar al DOM
import ToastAlert from './ToastAlert.vue';

describe('ToastAlert.vue', () => {
    it('debe mostrar el mensaje y aplicar la clase CSS correcta al llamar a show()', async () => {
        // 1. ARRANGE (Organizar)
        const wrapper = mount(ToastAlert);
        const testMessage = 'Paciente registrado con éxito';
        const testType = 'success';

        // 2. ACT (Actuar)
        wrapper.vm.show(testMessage, testType);
        
        // Obligamos a la prueba a esperar que Vue repinte el HTML tras el cambio de estado
        await nextTick();

        // 3. ASSERT (Afirmar)
        // Verificamos el estado visual resultante agnóstico a la estructura interna[cite: 5]
        expect(wrapper.text()).toContain(testMessage);
        
        // Verificamos que la clase exista en alguna parte del HTML renderizado
        expect(wrapper.html()).toContain(testType); 
    });
});