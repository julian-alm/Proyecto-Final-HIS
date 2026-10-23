import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('medical_supplies')
export class MedicalSupplyOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // Ej: "Ibuprofeno 400mg" (clave de negocio compartida con Billing)

  @Column({ nullable: true })
  description: string;
}