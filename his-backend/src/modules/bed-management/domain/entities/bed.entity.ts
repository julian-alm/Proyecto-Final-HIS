import { IBedState, FreeState } from '../states/bed.state';

export class Bed {
    constructor(
        public readonly id: string, // Ej: "CAMA-101"
        public readonly roomNumber: string,
        public patientId: string | null = null,
        private state: IBedState = new FreeState(),
        public version: number = 1 // Control de concurrencia optimista[cite: 13]
    ) {}

    get statusName(): string {
        return this.state.name;
    }

    changeState(newState: IBedState): void {
        this.state = newState;
    }

    assign(patientId: string): void {
        this.state.assignPatient(this, patientId);
    }

    discharge(): void {
        this.state.dischargePatient(this);
    }

    markAsClean(): void {
        this.state.finishCleaning(this);
    }

    block(): void {
        this.state.blockForMaintenance(this);
    }

    unblock(): void {
        this.state.unblock(this);
    }
}