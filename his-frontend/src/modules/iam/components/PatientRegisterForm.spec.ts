import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PatientRegisterForm from './PatientRegisterForm.vue';

describe('PatientRegisterForm.vue', () => {
  it('debería renderizar todos los campos correctamente incluyendo el nuevo DNI', () => {
    const wrapper = mount(PatientRegisterForm, {
      props: { isLoading: false }
    });
    
    expect(wrapper.find('#fullName').exists()).toBe(true);
    expect(wrapper.find('#dni').exists()).toBe(true);
    expect(wrapper.find('#email').exists()).toBe(true);
    expect(wrapper.find('#password').exists()).toBe(true);
  });

  it('debería emitir el evento "submit-register" con el payload completo', async () => {
    const wrapper = mount(PatientRegisterForm, {
      props: { isLoading: false }
    });

    // ACT: Simulamos que el paciente llena todos los datos
    await wrapper.find('#fullName').setValue('Carlos López');
    await wrapper.find('#dni').setValue('30112455'); // <-- Llenamos el nuevo input
    await wrapper.find('#email').setValue('carlos@correo.com');
    await wrapper.find('#password').setValue('123456');

    // Enviamos el formulario
    await wrapper.find('form').trigger('submit.prevent');

    // ASSERT: Verificamos que el emit salió y lleva el DNI
    expect(wrapper.emitted('submit-register')).toBeTruthy();
    expect(wrapper.emitted('submit-register')![0][0]).toEqual({
      fullName: 'Carlos López',
      dni: '30112455',
      email: 'carlos@correo.com',
      passwordPlain: '123456'
    });
  });

  it('debería mostrar el mensaje de error si el componente padre lo manda', () => {
    const wrapper = mount(PatientRegisterForm, {
      props: { isLoading: false, errorMessage: 'El email ya está registrado.' }
    });
    
    expect(wrapper.text()).toContain('El email ya está registrado.');
    expect(wrapper.find('.alert-error').exists()).toBe(true);
  });

  it('debería deshabilitar inputs y cambiar texto del botón cuando está cargando (isLoading)', () => {
    const wrapper = mount(PatientRegisterForm, {
      props: { isLoading: true }
    });
    
    // Verificamos que los atributos "disabled" estén presentes
    expect(wrapper.find('#fullName').attributes('disabled')).toBeDefined();
    expect(wrapper.find('#dni').attributes('disabled')).toBeDefined();
    expect(wrapper.find('.btn-submit').attributes('disabled')).toBeDefined();
    
    // Verificamos el feedback visual
    expect(wrapper.text()).toContain('Creando cuenta...');
  });
});