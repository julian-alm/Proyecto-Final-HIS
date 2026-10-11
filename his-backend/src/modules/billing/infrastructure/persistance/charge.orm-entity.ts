import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('charges')
export class ChargeOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @Column('decimal')
  baseCost: number;

  @Column('decimal')
  patientAmount: number;

  @Column('decimal')
  thirdPartyAmount: number;

  @Column()
  concept: string; // Ej: "Consulta Médica General" o "Insumos de Farmacia"

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  sourceEventId: string; // Cumple con: "vinculada al ID del evento original"
}