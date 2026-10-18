import { DomainException } from '../../../../shared/domain/domain-exception';
import { Bed } from '../entities/bed.entity';

export interface IBedState {
    readonly name: string;
    assignPatient(bed: Bed, patientId: string): void;
    dischargePatient(bed: Bed): void;
    finishCleaning(bed: Bed): void;
    blockForMaintenance(bed: Bed): void;
}

export class FreeState implements IBedState {
    readonly name = 'LIBRES'; // Puede ser asignada a un paciente ingresante[cite: 14]

    assignPatient(bed: Bed, patientId: string): void {
        bed.patientId = patientId;
        bed.changeState(new OccupiedState());
    }
    dischargePatient(): void { throw new DomainException('No se puede dar de alta a una cama libre.'); }
    finishCleaning(): void { throw new DomainException('La cama ya está libre, no está en limpieza.'); }
    blockForMaintenance(bed: Bed): void { bed.changeState(new BlockedState()); }
    }

export class OccupiedState implements IBedState {
    readonly name = 'OCUPADAS'; // Solo permite transición a limpieza tras el alta[cite: 14]

    assignPatient(): void { throw new DomainException('Error de concurrencia: La cama acaba de ser ocupada.'); }
    
    dischargePatient(bed: Bed): void {
        bed.patientId = null;
        bed.changeState(new CleaningState()); // Pasa automáticamente a "en limpieza"[cite: 14]
    }

    finishCleaning(): void { throw new DomainException('Una cama ocupada no está en proceso de limpieza.'); }
    blockForMaintenance(): void { throw new DomainException('No se puede bloquear una cama ocupada por un paciente.'); }
    }

    export class CleaningState implements IBedState {
    readonly name = 'EN_LIMPIEZA'; // Bloqueada hasta que maestranza confirme higiene[cite: 14]

    assignPatient(): void { throw new DomainException('No se puede asignar un paciente a una cama en limpieza.'); }
    dischargePatient(): void { throw new DomainException('La cama ya está desocupada y en limpieza.'); }
    
    finishCleaning(bed: Bed): void {
        bed.changeState(new FreeState()); // Actualiza el estado a "libres"[cite: 15]
    }

    blockForMaintenance(bed: Bed): void { bed.changeState(new BlockedState()); }
    }

    export class BlockedState implements IBedState {
    readonly name = 'BLOQUEADAS'; // Fuera de servicio por mantenimiento[cite: 14]

    assignPatient(): void { throw new DomainException('La cama está fuera de servicio por mantenimiento.'); }
    dischargePatient(): void { throw new DomainException('La cama está bloqueada y vacía.'); }
    finishCleaning(): void { throw new DomainException('La cama está en mantenimiento, no en limpieza.'); }
    blockForMaintenance(): void { throw new DomainException('La cama ya está bloqueada.'); }
}