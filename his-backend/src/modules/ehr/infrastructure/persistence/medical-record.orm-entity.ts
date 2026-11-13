import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('medical_records') // Este será el nombre de la tabla en PostgreSQL
export class MedicalRecordOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId: string;

  @Column({ name: 'blood_type', type: 'varchar', length: 10, nullable: true })
  bloodType: string | null;

  // Usamos jsonb (JSON binario) que es excelente en PostgreSQL para guardar arrays
  @Column({ type: 'jsonb', default: [] })
  allergies: string[];

  @Column({ name: 'chronic_conditions', type: 'jsonb', default: [] })
  chronicConditions: string[];

  // Guardamos el array de objetos de evoluciones médicas también como JSON
  @Column({ name: 'progress_notes', type: 'jsonb', default: [] })
  progressNotes: { doctorId: string; note: string; date: Date }[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}