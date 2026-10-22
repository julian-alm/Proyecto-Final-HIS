import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('medical_supplies')
export class SupplyOrmEntity {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column('int')
    stock: number;
}