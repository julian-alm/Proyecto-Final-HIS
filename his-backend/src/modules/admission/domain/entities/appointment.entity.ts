import { IAppointmentState, ConfirmedState } from '../states/appointment-state.interface';

export class Appointment {
    constructor(
        public readonly id: string,
        public readonly doctorId: string,
        public patientId: string | null,
        public startTime: Date,
        public durationMinutes: number = 30,
        private state: IAppointmentState = new ConfirmedState(),
    ) {}
    
    get statusName(): string {
        return this.state.name;
    }
    
    setState(newState: IAppointmentState): void {
        this.state = newState;
    }
    
    // Delegación al Patrón State
    announceArrival(): void {
        this.state.checkInWaitingRoom(this);
    }
    
    cancel(): void {
        this.state.cancel(this);
    }
}