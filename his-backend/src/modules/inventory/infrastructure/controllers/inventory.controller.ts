import { Controller, Get, Post, Body, Param, HttpException, HttpStatus, Inject, UseGuards } from '@nestjs/common';
import { ISupplyRepository } from '../../domain/ports/supply.repository.port';
import { MedicalSupply } from '../../domain/entities/medical-supply.entity';
import { RolesGuard } from '../../../iam/infrastructure/guards/roles.guard';
import { Roles } from '../../../iam/infrastructure/guards/roles.guard';
import { UserRole } from '../../../iam/domain/entities/user-role.enum';
import { v4 as uuidv4 } from 'uuid';

@Controller('inventory')
@UseGuards(RolesGuard)
export class InventoryController {
    constructor(
        @Inject(ISupplyRepository)
        private readonly supplyRepository: ISupplyRepository,
    ) {}

    // Endpoint para cargar el insumo inicial desde REST Client (ej: 50 unidades de Ibuprofeno 400mg)
    @Post('supplies')
    @Roles(UserRole.ADMIN, UserRole.NURSE)
    async createOrUpdateSupply(@Body() body: { name: string; stock: number }) {
        const existing = await this.supplyRepository.findByName(body.name);
        const supply = new MedicalSupply(
            existing ? existing.id : uuidv4(),
            body.name,
            Number(body.stock),
        );
        await this.supplyRepository.save(supply);
        return { message: 'Stock inicial configurado correctamente', supply };
    }

    // Endpoint para verificar el stock actual tras el descuento automático
    @Get('supplies/:name')
    @Roles(UserRole.ADMIN, UserRole.NURSE, UserRole.DOCTOR)
    async getSupplyStock(@Param('name') name: string) {
        const supply = await this.supplyRepository.findByName(name);
        if (!supply) {
            throw new HttpException('Insumo no encontrado', HttpStatus.NOT_FOUND);
        }
        return supply;
    }
}