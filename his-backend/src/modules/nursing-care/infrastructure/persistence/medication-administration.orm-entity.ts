import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('medication_administrations')
export class MedicationAdministrationOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @Column()
  nurseId: string;

  @Column()
  medicationName: string;

  @Column()
  dose: string;

  @Column({ type: 'timestamp' })
  scheduledTime: Date;

  @Column({ type: 'timestamp' })
  administeredTime: Date;

  @Column()
  status: string; // 'ADMINISTRADA' o 'FUERA_DE_TERMINO'
}