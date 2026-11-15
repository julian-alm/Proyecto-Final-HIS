import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('doctor_patient_assignments')
export class DoctorPatientAssignmentOrmEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // El ID del perfil del doctor (el que viene de DoctorProfileOrmEntity)
    @Column('uuid')
    doctorId: string; 

    // El ID o DNI del paciente (lo guardamos como string para no tocar la entidad Patient)
    @Column()
    patientId: string; 

    @CreateDateColumn()
    assignedAt: Date;
}