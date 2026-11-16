import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('doctor_patient_assignments')
export class DoctorPatientAssignmentOrmEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    doctorId: string; 

    @Column()
    patientId: string; 

    @CreateDateColumn()
    assignedAt: Date;
}