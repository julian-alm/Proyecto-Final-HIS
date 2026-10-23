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
  medicationName: string; // Nombre del insumo para asociarlo con el catálogo y la lista de precios

  @Column('int')
  quantity: number;

  @Column({ type: 'enum', enum: MovementType })
  type: MovementType; // INGRESO o EGRESO

  @Column()
  reason: string; // Motivo detallado (ej: "Compra a proveedor Lote #12" o "Administración a paciente UUID")

  @CreateDateColumn()
  createdAt: Date;
}