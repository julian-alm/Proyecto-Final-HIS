import { Controller, Get, Post, Body, HttpException, HttpStatus, Inject, UseGuards } from '@nestjs/common';
import { ISupplyRepository } from '../../domain/ports/supply.repository.port';
import { MedicalSupply } from '../../domain/entities/medical-supply.entity';
import { RolesGuard, Roles } from '../../../iam/infrastructure/guards/roles.guard';
import { UserRole } from '../../../iam/domain/entities/user-role.enum';
import { v4 as uuidv4 } from 'uuid';

@Controller('inventory')
@UseGuards(RolesGuard)
export class InventoryController {
    constructor(
        @Inject(ISupplyRepository)
        private readonly supplyRepository: ISupplyRepository,
    ) {}

    @Post('movements')
    @Roles(UserRole.ADMIN, UserRole.NURSE)
    async registerMovement(@Body() body: { medicationName: string; quantity: number; type: 'INGRESO' | 'EGRESO'; reason: string }) {
        if (!body.medicationName || !body.quantity || !body.type) {
            throw new HttpException('Faltan datos obligatorios', HttpStatus.BAD_REQUEST);
        }

        if (body.type === 'INGRESO') {
            const existing = await this.supplyRepository.findByName(body.medicationName);
            // Tu método save() ya se encarga de crear el insumo y registrar el movimiento tipo INGRESO
            const supply = new MedicalSupply(
                existing ? existing.id : uuidv4(),
                body.medicationName,
                Number(body.quantity),
                existing ? existing.description : body.reason
            );
            await this.supplyRepository.save(supply);
            return { message: 'Ingreso registrado correctamente' };
        } 
        
        if (body.type === 'EGRESO') {
            try {
                // Tu método atómico ya valida stock insuficiente e inserta el EGRESO
                await this.supplyRepository.decrementStockAtomically(body.medicationName, Number(body.quantity));
                return { message: 'Egreso registrado correctamente' };
            } catch (error: any) {
                // Capturamos tu DomainException (ej: "Stock insuficiente")
                throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
            }
        }
    }

    @Get('movements')
    @Roles(UserRole.ADMIN, UserRole.NURSE, UserRole.DOCTOR)
    async getMovementsHistory() {
        return await this.supplyRepository.getMovementHistory();
    }

    @Get('stock')
    @Roles(UserRole.ADMIN, UserRole.NURSE, UserRole.DOCTOR)
    async getCurrentStock() {
        return await this.supplyRepository.getCurrentStock();
    }
}