import { Injectable, Inject } from '@nestjs/common';
import { ISupplyRepository } from '../../domain/ports/supply.repository.port';
import { MedicalSupply } from '../../domain/entities/medical-supply.entity';

export class DeductSupplyStockCommand {
    constructor(
        public readonly supplyName: string,
        public readonly quantity: number = 1,
    ) {}
}

@Injectable()
export class DeductSupplyStockUseCase {
    constructor(
        @Inject(ISupplyRepository)
        private readonly supplyRepository: ISupplyRepository,
    ) {}

    async execute(command: DeductSupplyStockCommand): Promise<MedicalSupply> {
        return await this.supplyRepository.decrementStockAtomically(
            command.supplyName,
            command.quantity,
        );
    }
}