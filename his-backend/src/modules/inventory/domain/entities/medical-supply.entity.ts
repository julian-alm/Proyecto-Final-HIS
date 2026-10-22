import { DomainException } from '../../../../shared/domain/domain-exception';

export class MedicalSupply {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public stock: number,
    ) {}

    deduct(quantity: number): void {
        if (quantity <= 0) {
            throw new DomainException('La cantidad a descontar debe ser mayor a cero.');
        }
        if (this.stock < quantity) {
            throw new DomainException(`Stock insuficiente para ${this.name}. Disponible: ${this.stock}`);
        }
        this.stock -= quantity;
    }
}