export class BedStatusChangedEvent {
    constructor(
        public readonly bedId: string,
        public readonly roomNumber: string,
        public readonly newStatus: string,
        public readonly timestamp: Date = new Date()
    ) {}
}