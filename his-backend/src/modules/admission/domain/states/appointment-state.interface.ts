import { DomainException } from '../../../../shared/domain/domain-exception';
import { Appointment } from '../entities/appointment.entity';

export interface IAppointmentState {
readonly name: string;
confirm(appointment: Appointment): void;
checkInWaitingRoom(appointment: Appointment): void;
completeAttention(appointment: Appointment): void;
cancel(appointment: Appointment): void;
}

// Estado Concreto: Confirmado
export class ConfirmedState implements IAppointmentState {
readonly name = 'CONFIRMADO';

confirm(): void {
    throw new DomainException('El turno ya se encuentra confirmado.');
}
checkInWaitingRoom(appointment: Appointment): void {
    (appointment as any).setState(new WaitingRoomState());
}
completeAttention(): void {
    throw new DomainException('El paciente debe pasar por Sala de Espera antes de ser atendido.');
}
cancel(appointment: Appointment): void {
    (appointment as any).setState(new CancelledState());
}
}

// Estado Concreto: En Sala de Espera
export class WaitingRoomState implements IAppointmentState {
readonly name = 'EN_SALA_DE_ESPERA';

confirm(): void {
    throw new DomainException('El paciente ya está en sala de espera.');
}
checkInWaitingRoom(): void {
    throw new DomainException('El paciente ya fue anunciado en sala de espera.');
}
completeAttention(): void {
    // Aquí pasaría a AtendidoState
}
cancel(): void {
    throw new DomainException('No se puede cancelar un turno cuando ya está en sala de espera.');
}
}

// Estado Concreto: Cancelado (Cumple HU 2.1 Escenario 2)
export class CancelledState implements IAppointmentState {
readonly name = 'CANCELADO';

confirm(): void {
    throw new DomainException('Un turno cancelado no puede avanzar en el flujo de atención.');
}
checkInWaitingRoom(): void {
    throw new DomainException('Un turno cancelado no puede avanzar en el flujo de atención.');
}
completeAttention(): void {
    throw new DomainException('Un turno cancelado no puede avanzar en el flujo de atención.');
}
cancel(): void {
    throw new DomainException('El turno ya está cancelado.');
}
}