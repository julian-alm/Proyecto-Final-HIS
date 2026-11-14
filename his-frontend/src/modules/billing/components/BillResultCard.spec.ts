import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BillResultCard from './BillResultCard.vue';

describe('BillResultCard.vue', () => {
  const defaultResult = {
    patientId: 'uuid-123',
    patientFullName: 'Carlos López',
    patientDni: '12345678',
    coverageType: 'PREPAID',
    consultationBaseCost: 15000,
    patientAmount: 3000,
    thirdPartyAmount: 12000,
  };

  it('debería renderizar la información del paciente y la cobertura correctamente', () => {
    const wrapper = mount(BillResultCard, {
      props: { result: defaultResult as any }
    });

    expect(wrapper.text()).toContain('Carlos López');
    expect(wrapper.text()).toContain('12345678');
    expect(wrapper.text()).toContain('Obra Social / Prepaga'); 
  });

  it('debería calcular y renderizar los montos correctamente', () => {
    const wrapper = mount(BillResultCard, {
      props: { result: defaultResult as any }
    });

    expect(wrapper.text()).toContain('$15000');
    expect(wrapper.text()).toContain('$3000');
    expect(wrapper.text()).toContain('$12000');
  });

  it('debería emitir el evento "clear" al hacer clic en el botón Cerrar', async () => {
    const wrapper = mount(BillResultCard, {
      props: { result: defaultResult as any }
    });

    await wrapper.find('.btn-clear').trigger('click');

    expect(wrapper.emitted()).toHaveProperty('clear');
    expect(wrapper.emitted('clear')).toHaveLength(1);
  });

  it('debería manejar fallbacks a cero cuando faltan montos en el objeto', () => {
    const emptyResult = { coverageType: 'PRIVATE' }; 
    const wrapper = mount(BillResultCard, {
      props: { result: emptyResult as any }
    });

    expect(wrapper.text()).toContain('$0'); 
  });
});