import { Entity, PrimaryColumn, Column, VersionColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PatientOrmEntity } from '../../../ehr/infrastructure/persistence/patient.orm-entity'; // Ajusta esta ruta

@Entity('appointments')
export class AppointmentOrmEntity {
    @PrimaryColumn('uuid')
    id: string;
    
    @Column()
    doctorId: string;
    
    @Column({ nullable: true })
    patientId: string;
    
    @Column({ type: 'timestamp' })
    startTime: Date;
    
    @Column({ type: 'timestamp', nullable: true })
    endTime: Date;
    
    @Column({ default: false })
    isOverbooking: boolean;

    @Column()
    status: string;
    
    // ¡Magia de concurrencia! TypeORM la incrementa sola.
    @VersionColumn()
    version: number; 

    @ManyToOne(() => PatientOrmEntity)
    @JoinColumn({ name: 'patientId' })
    patient: PatientOrmEntity;
}