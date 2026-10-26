import { IAppointmentState, AvailableState } from '../states/appointment.state';

export class Appointment {
    constructor(
        public readonly id: string,
        public readonly doctorId: string,
        public readonly startTime: Date,
        public endTime: Date,
        public patientId: string | null = null,
        private state: IAppointmentState = new AvailableState(),
        public version: number = 1,
        public isOverbooking: boolean = false
    ) {}

    get statusName(): string {
        return this.state.name;
    }

    changeState(newState: IAppointmentState): void {
        this.state = newState;
    }

    book(patientId: string): void {
        this.state.book(this, patientId);
    }

    checkInWaitingRoom(): void {
        this.state.checkIn(this);
    }

    completeAttention(): void {
        this.state.complete(this);
    }

    cancel(): void {
        this.state.cancel(this);
    }
}