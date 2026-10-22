import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('patients')
export class PatientOrmEntity {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ unique: true })
    dni: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    coverageType: string;
}