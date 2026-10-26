import { Appointment } from './appointment.entity';
import { DomainException } from '../../../../shared/domain/domain-exception';
import { BookedState, WaitingRoomState } from '../states/appointment.state';

describe('Appointment Entity (State Pattern)', () => {
    let appointment: Appointment;

    // Antes de cada prueba, creamos un turno nuevo (Estado por defecto: DISPONIBLE)
    beforeEach(() => {
        // Simulamos un turno de 30 minutos
        const start = new Date('2026-10-20T10:00:00Z');
        const end = new Date('2026-10-20T10:30:00Z');

        appointment = new Appointment(
            'uuid-turno-1',
            'dr-smith',
            start,
            end, // <-- AGREGADO (endTime)
            null, // patientId
            undefined, // Toma el state por defecto (AvailableState)
            1, // version
            false // isOverbooking
        );
    });

    it('debería inicializarse en estado DISPONIBLE', () => {
        expect(appointment.statusName).toBe('DISPONIBLE');
        expect(appointment.patientId).toBeNull();
    });

    it('debería permitir reservar el turno y cambiar su estado a RESERVADO', () => {
        appointment.book('paciente-123');
        
        expect(appointment.patientId).toBe('paciente-123');
        expect(appointment.statusName).toBe('RESERVADO');
    });

    it('debería lanzar una DomainException si se intenta anunciar en sala de espera un turno DISPONIBLE', () => {
        // Al intentar hacer check-in directo de un turno virgen, debe fallar
        expect(() => appointment.checkInWaitingRoom()).toThrow(DomainException);
        expect(() => appointment.checkInWaitingRoom()).toThrow('Un turno disponible no puede pasar a sala de espera.');
    });

    it('debería lanzar una DomainException si se intenta cancelar un turno que ya está EN_SALA_DE_ESPERA', () => {
        // Forzamos el estado a Sala de Espera
        appointment.changeState(new WaitingRoomState());

        expect(() => appointment.cancel()).toThrow(DomainException);
        expect(() => appointment.cancel()).toThrow('No se puede cancelar un turno cuando el paciente ya está en el hospital.');
    });
});