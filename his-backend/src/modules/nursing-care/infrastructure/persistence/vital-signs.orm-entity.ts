import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';


@Entity('vital_signs')
export class VitalSignsOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @Column({ type: 'decimal', precision: 4, scale: 2 })
  temperature: number;

  
  @Column()
  bloodPressure: string;

  @Column('int')
  heartRate: number;

  @CreateDateColumn()
  recordedAt: Date;
}