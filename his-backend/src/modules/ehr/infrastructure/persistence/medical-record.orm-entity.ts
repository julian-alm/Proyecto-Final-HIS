import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('medical_records')
export class MedicalRecordOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ name: 'blood_type', type: 'varchar', length: 10, nullable: true })
  bloodType: string | null;

  @Column({ type: 'jsonb', default: [] })
  allergies: string[];

  @Column({ name: 'chronic_conditions', type: 'jsonb', default: [] })
  chronicConditions: string[];

  @Column({ name: 'progress_notes', type: 'jsonb', default: [] })
  progressNotes: { doctorId: string; note: string; date: Date }[];

  @Column({ name: 'care_protocols', type: 'jsonb', default: [] })
  careProtocols: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}