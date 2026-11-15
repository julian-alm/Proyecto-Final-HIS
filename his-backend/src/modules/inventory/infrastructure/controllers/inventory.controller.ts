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

    // Función auxiliar para formatear: "iBuProFeNo 400MG" -> "Ibuprofeno 400mg"
    private formatSupplyName(name: string): string {
        if (!name) return '';
        const trimmed = name.trim();
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    }

    @Post('movements')
    @Roles(UserRole.ADMIN, UserRole.NURSE)
    async registerMovement(@Body() body: { medicationName: string; quantity: number; type: 'INGRESO' | 'EGRESO'; reason: string }) {
        if (!body.medicationName || !body.quantity || !body.type) {
            throw new HttpException('Faltan datos obligatorios', HttpStatus.BAD_REQUEST);
        }

        // Limpiamos los espacios y aplicamos el formato profesional
        const formattedName = this.formatSupplyName(body.medicationName);

        if (body.type === 'INGRESO') {
            const existing = await this.supplyRepository.findByName(formattedName);
            
            const supply = new MedicalSupply(
                existing ? existing.id : uuidv4(),
                existing ? existing.name : formattedName, // Usamos el nombre bien formateado si es nuevo
                Number(body.quantity),
                existing ? existing.description : body.reason
            );
            
            // Pasamos el motivo dinámico (body.reason) aquí
            await this.supplyRepository.save(supply, body.reason);
            return { message: 'Ingreso registrado correctamente' };
        } 
        
        if (body.type === 'EGRESO') {
            try {
                // Pasamos el motivo dinámico (body.reason) aquí también
                await this.supplyRepository.decrementStockAtomically(formattedName, Number(body.quantity), body.reason);
                return { message: 'Egreso registrado correctamente' };
            } catch (error: any) {
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