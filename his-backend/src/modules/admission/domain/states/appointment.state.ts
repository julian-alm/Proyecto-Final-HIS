import { DomainException } from '../../../../shared/domain/domain-exception';
import { Appointment } from '../entities/appointment.entity';

export interface IAppointmentState {
    readonly name: string;
    book(appointment: Appointment, patientId: string): void;
    checkIn(appointment: Appointment): void;
    complete(appointment: Appointment): void;
    cancel(appointment: Appointment): void;
}

export class AvailableState implements IAppointmentState {
    readonly name = 'DISPONIBLE';

    book(appointment: Appointment, patientId: string): void {
        appointment.patientId = patientId;
        (appointment as any).changeState(new BookedState());
    }
    checkIn(): void { throw new DomainException('Un turno disponible no puede pasar a sala de espera.'); }
    complete(): void { throw new DomainException('Un turno disponible no puede completarse.'); }
    cancel(): void { throw new DomainException('No se puede cancelar un turno que no ha sido reservado.'); }
}

export class BookedState implements IAppointmentState {
    readonly name = 'RESERVADO';

    book(): void { throw new DomainException('El turno ya no se encuentra disponible.'); }
    
    checkIn(appointment: Appointment): void {
        (appointment as any).changeState(new WaitingRoomState());
    }

    complete(): void { throw new DomainException('El paciente debe pasar por Sala de Espera primero.'); }

    cancel(appointment: Appointment): void {
        (appointment as any).changeState(new CancelledState());
    }
}

export class WaitingRoomState implements IAppointmentState {
    readonly name = 'EN_SALA_DE_ESPERA';

    book(): void { throw new DomainException('El turno ya está reservado y el paciente en espera.'); }
    checkIn(): void { throw new DomainException('El paciente ya fue anunciado en sala de espera.'); }
    
    complete(appointment: Appointment): void {
        (appointment as any).changeState(new CompletedState());
    }

    cancel(): void { throw new DomainException('No se puede cancelar un turno cuando el paciente ya está en el hospital.'); }
}

export class CompletedState implements IAppointmentState {
    readonly name = 'ATENDIDO';
    book(): void { throw new DomainException('El turno ya finalizó.'); }
    checkIn(): void { throw new DomainException('El turno ya finalizó.'); }
    complete(): void { throw new DomainException('El turno ya finalizó.'); }
    cancel(): void { throw new DomainException('No se puede cancelar un turno ya atendido.'); }
}

export class CancelledState implements IAppointmentState {
    readonly name = 'CANCELADO';
    book(): void { throw new DomainException('El turno está cancelado.'); }
    checkIn(): void { throw new DomainException('El turno está cancelado.'); }
    complete(): void { throw new DomainException('El turno está cancelado.'); }
    cancel(): void { throw new DomainException('El turno ya está cancelado.'); }
}