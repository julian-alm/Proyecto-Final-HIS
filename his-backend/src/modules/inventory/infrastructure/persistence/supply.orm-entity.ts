import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('medical_supplies')
export class MedicalSupplyOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;
}