import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('price_lists')
export class PriceListOrmEntity {
  @PrimaryColumn()
  itemName: string; // Ej: "Ibuprofeno 400mg"

  @Column('decimal')
  unitPrice: number;
}
