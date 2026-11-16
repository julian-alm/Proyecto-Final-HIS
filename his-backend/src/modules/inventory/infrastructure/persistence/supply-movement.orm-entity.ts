import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

export enum MovementType {
  INGRESO = 'INGRESO',
  EGRESO = 'EGRESO',
}

@Entity('supply_movements')
export class SupplyMovementOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  medicationName: string; 
  @Column('int')
  quantity: number;

  @Column({ type: 'enum', enum: MovementType })
  type: MovementType;

  @Column()
  reason: string; 

  @CreateDateColumn()
  createdAt: Date;
}