import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import ToastAlert from './ToastAlert.vue';

describe('ToastAlert.vue', () => {
    it('debe mostrar el mensaje y aplicar la clase CSS correcta al llamar a show()', async () => {
        // 1. ARRANGE (Organizar)
        const wrapper = mount(ToastAlert);
        const testMessage = 'Paciente registrado con éxito';
        const testType = 'success';

        // 2. ACT (Actuar)
        wrapper.vm.show(testMessage, testType);

        await nextTick();

        // 3. ASSERT (Afirmar)
        expect(wrapper.text()).toContain(testMessage);

        expect(wrapper.html()).toContain(testType); 
    });
});