import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('price_lists')
export class PriceListOrmEntity {
  @PrimaryColumn()
  itemName: string; 

  @Column('decimal')
  unitPrice: number;
}
