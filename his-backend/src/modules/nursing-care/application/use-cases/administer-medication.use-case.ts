import { Injectable, Inject, Optional, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { MedicationAdministration } from '../../domain/entities/medication-administration.entity';
import { IMedicationAdministrationRepository } from '../../domain/ports/medication-administration.repository.port';
import { MedicationAdministeredEvent } from '../../../../shared/domain/events/medication-administered.event';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class AdministerMedicationCommand {
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  nurseId: string;

  @IsString()
  @IsNotEmpty()
  medicationName: string;

  @IsString()
  @IsNotEmpty()
  dose: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  scheduledTime: string;

  @IsString()
  @IsNotEmpty()
  administeredTime: string;
}

@Injectable()
export class AdministerMedicationUseCase {
  constructor(
    @Inject(IMedicationAdministrationRepository)
    private readonly repository: IMedicationAdministrationRepository,
    private readonly eventEmitter: EventEmitter2,
    @Optional()
    @InjectEntityManager()
    private readonly entityManager?: EntityManager,
  ) {}

  async execute(command: AdministerMedicationCommand): Promise<MedicationAdministration> {
    const baseName = command.medicationName.trim();
    const dose = command.dose.trim();
    const combinedName = dose ? `${baseName} ${dose}` : baseName;
    let canonicalName = combinedName;

    // 1. Validaciones previas (Inventario, Stock y Lista de Precios)
    if (this.entityManager) {
      // A) Buscar en Inventario: primero "Medicamento + Dosis", si no, solo "Medicamento"
      let supplyRows = await this.entityManager.query(
        `SELECT name FROM medical_supplies WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1`,
        [combinedName],
      );

      if (!supplyRows || supplyRows.length === 0) {
        supplyRows = await this.entityManager.query(
          `SELECT name FROM medical_supplies WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1`,
          [baseName],
        );
      }

      if (!supplyRows || supplyRows.length === 0) {
        throw new BadRequestException(
          `El insumo "${combinedName}" no existe en el inventario.`,
        );
      }

      canonicalName = supplyRows[0].name;

      // B) Validar stock disponible
      const stockResult = await this.entityManager
        .getRepository('SupplyMovementOrmEntity')
        .createQueryBuilder('movement')
        .select(
          "SUM(CASE WHEN movement.type = 'INGRESO' THEN movement.quantity ELSE -movement.quantity END)",
          'totalStock',
        )
        .where('LOWER(TRIM(movement.medicationName)) = LOWER(TRIM(:name))', {
          name: canonicalName,
        })
        .getRawOne();

      const currentStock =
        stockResult && stockResult.totalStock
          ? parseInt(stockResult.totalStock, 10)
          : 0;

      if (currentStock < Number(command.quantity)) {
        throw new BadRequestException(
          `Stock insuficiente de "${canonicalName}". Disponible: ${currentStock}, solicitado: ${command.quantity}.`,
        );
      }

      // C) Validar que exista en la lista de precios de Facturación
      const priceItem = await this.entityManager
        .getRepository('PriceListOrmEntity')
        .createQueryBuilder('price')
        .where('LOWER(TRIM(price.itemName)) = LOWER(TRIM(:name))', {
          name: canonicalName,
        })
        .getOne();

      if (!priceItem) {
        throw new BadRequestException(
          `El insumo "${canonicalName}" no figura en la lista de precios de Facturación.`,
        );
      }
    }

    const id = Math.random().toString(36).substring(2, 9);

    // 2. Guardar la administración
    const administration = new MedicationAdministration(
      id,
      command.patientId,
      command.nurseId,
      canonicalName,
      command.dose,
      command.quantity,
      new Date(command.scheduledTime),
      new Date(command.administeredTime),
    );

    await this.repository.save(administration);

    // 3. Emitir el evento solo si pasó todas las validaciones
    const event = new MedicationAdministeredEvent(
      administration.patientId,
      canonicalName,
      command.quantity,
      administration.administeredTime,
    );

    this.eventEmitter.emit('medication.administered', event);

    return administration;
  }
}