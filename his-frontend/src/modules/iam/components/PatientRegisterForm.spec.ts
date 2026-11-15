import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PatientRegisterForm from './PatientRegisterForm.vue';

describe('PatientRegisterForm.vue', () => {
  
  it('debería emitir "submit-register" con los datos completos al enviar el formulario', async () => {
    // ARRANGE: Montamos el componente pasando los props iniciales
    const wrapper = mount(PatientRegisterForm, {
      props: { isLoading: false, errorMessage: '' }
    });

    // ACT: Simulamos la escritura del usuario
    await wrapper.find('#fullName').setValue('Mariano Paciente');
    await wrapper.find('#email').setValue('mariano@paciente.com');
    await wrapper.find('#password').setValue('ClaveSegura123');
    
    // Simulamos el envío del formulario
    await wrapper.find('form').trigger('submit.prevent');

    // ASSERT: Verificamos que el evento suba hacia la vista con el payload exacto
    expect(wrapper.emitted()).toHaveProperty('submit-register');
    const emitEvent = wrapper.emitted('submit-register');
    
    expect(emitEvent?.[0]).toEqual([{ 
      fullName: 'Mariano Paciente',
      email: 'mariano@paciente.com', 
      passwordPlain: 'ClaveSegura123' 
    }]);
  });

  it('debería deshabilitar los inputs y el botón cuando isLoading es true', async () => {
    // ARRANGE
    const wrapper = mount(PatientRegisterForm, {
      props: { isLoading: true }
    });

    // ACT & ASSERT: Verificamos el estado del DOM
    const fullNameInput = wrapper.find('#fullName');
    const emailInput = wrapper.find('#email');
    const submitButton = wrapper.find('.btn-submit');

    expect((fullNameInput.element as HTMLInputElement).disabled).toBe(true);
    expect((emailInput.element as HTMLInputElement).disabled).toBe(true);
    expect((submitButton.element as HTMLButtonElement).disabled).toBe(true);
    expect(submitButton.text()).toBe('Creando cuenta...');
  });

  it('debería mostrar el mensaje de error si errorMessage tiene contenido', () => {
    const wrapper = mount(PatientRegisterForm, {
      props: { isLoading: false, errorMessage: 'El email ya existe' }
    });

    const errorDiv = wrapper.find('.alert-error');
    expect(errorDiv.exists()).toBe(true);
    expect(errorDiv.text()).toBe('El email ya existe');
  });
});