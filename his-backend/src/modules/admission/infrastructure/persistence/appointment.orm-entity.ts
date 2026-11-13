import { Entity, PrimaryColumn, Column, VersionColumn } from 'typeorm';

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
    
    @Column()
    status: string;
    
    // ¡Magia de concurrencia! TypeORM la incrementa sola.
    @VersionColumn()
    version: number; 
}