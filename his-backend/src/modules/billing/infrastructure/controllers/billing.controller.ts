import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { IsString, IsNumber, IsIn, IsNotEmpty, Min } from 'class-validator'; // <-- Agregá Min
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalculateConsultationCostUseCase } from '../../application/use-cases/calculate-consultation-cost.use-case';
import type { CoverageType } from '../../domain/factories/billing-strategy.factory';
import { RolesGuard, Roles } from '../../../iam/infrastructure/guards/roles.guard';
import { UserRole } from '../../../iam/domain/entities/user-role.enum';
import { PriceListOrmEntity } from '../persistance/price-list.orm-entity';
import { ChargeOrmEntity } from '../persistance/charge.orm-entity';


export class CreatePriceDto {
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @IsNumber()
  @Min(0) 
  unitPrice: number;
}

export class GenerateBillDto {
  @IsString() @IsNotEmpty() patientId: string;
  @IsIn(['PUBLIC', 'PREPAID', 'PRIVATE']) coverageType: CoverageType;
  @IsNumber() @Min(0) consultationBaseCost: number;
}

@Controller('billing')
@UseGuards(RolesGuard) 
export class BillingController {
  constructor(
    private readonly calculateCostUseCase: CalculateConsultationCostUseCase,
    @InjectRepository(PriceListOrmEntity)
    private readonly priceRepo: Repository<PriceListOrmEntity>,

    @InjectRepository(ChargeOrmEntity)
    private readonly chargeRepo: Repository<ChargeOrmEntity>
  ) {}

  @Post('calculate')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  calculate(@Body() dto: GenerateBillDto) {
    return this.calculateCostUseCase.execute(dto);
  }


  @Post('prices')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async addPrice(@Body() dto: CreatePriceDto) {
    const priceItem = this.priceRepo.create(dto);
    await this.priceRepo.save(priceItem);
    return { message: 'Precio actualizado en la lista', item: priceItem };
  }

  @Get('prices')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.NURSE) 
  async getPrices() {
    return this.priceRepo.find({
      order: { itemName: 'ASC' }, 
    });
  }

  @Get('charges')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async getCharges() {
    return this.chargeRepo.find({
      order: { createdAt: 'DESC' }, 
      take: 100, 
    });
  }
}