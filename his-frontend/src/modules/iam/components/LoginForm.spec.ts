import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LoginForm from './LoginForm.vue';

describe('LoginForm.vue', () => {
  
  it('debería emitir el evento "submit-login" con las credenciales al enviar el formulario', async () => {
    // ARRANGE: Montamos el componente aislando su lógica
    const wrapper = mount(LoginForm, {
      props: { isLoading: false, errorMessage: '' }
    });

    // ACT: Simulamos que el usuario escribe y aprieta Enter
    await wrapper.find('#email').setValue('admin@hospital.com');
    await wrapper.find('#password').setValue('123456');
    await wrapper.find('form').trigger('submit.prevent');

    // ASSERT: Verificamos que el componente haya escupido el evento correcto
    expect(wrapper.emitted()).toHaveProperty('submit-login');
    const emitEvent = wrapper.emitted('submit-login');
    
    expect(emitEvent?.[0]).toEqual([{ 
      email: 'admin@hospital.com', 
      passwordPlain: '123456' 
    }]);
  });

  it('debería deshabilitar los inputs cuando isLoading es true', async () => {
    const wrapper = mount(LoginForm, {
      props: { isLoading: true, errorMessage: '' }
    });
    
    const emailInput = wrapper.find('#email');
    const submitButton = wrapper.find('.btn-submit');

    expect((emailInput.element as HTMLInputElement).disabled).toBe(true);
    expect((submitButton.element as HTMLButtonElement).disabled).toBe(true);
  });
});