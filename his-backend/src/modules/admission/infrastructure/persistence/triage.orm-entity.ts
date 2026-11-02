import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('triage_queue')
export class TriageOrmEntity {
    @PrimaryColumn('uuid')
    id: string;

    @Column()
    patientId: string;

    @Column('int')
    level: number;

    @Column()
    symptoms: string;

    @Column({ type: 'timestamp' })
    arrivalTime: Date;

    @Column()
    status: string;
}