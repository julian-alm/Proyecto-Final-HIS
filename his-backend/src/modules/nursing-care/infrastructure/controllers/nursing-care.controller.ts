import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { AdministerMedicationUseCase, AdministerMedicationCommand } from '../../application/use-cases/administer-medication.use-case';
import { RecordVitalSignsUseCase, RecordVitalSignsCommand } from '../../application/use-cases/record-vital-signs.use-case';
import { GenerateCareProtocolUseCase, GenerateProtocolCommand } from '../../application/use-cases/generate-care-protocol.use-case';
import { GetVitalSignsHistoryUseCase } from '../../application/use-cases/get-vital-signs-history.use-case';
import { RolesGuard, Roles } from '../../../iam/infrastructure/guards/roles.guard';
import { UserRole } from '../../../iam/domain/entities/user-role.enum';

@Controller('nursing-care')
@UseGuards(RolesGuard)
export class NursingCareController {
 constructor(
    private readonly recordVitalSignsUseCase: RecordVitalSignsUseCase,
    private readonly generateCareProtocolUseCase: GenerateCareProtocolUseCase,
    private readonly administerMedicationUseCase: AdministerMedicationUseCase,// <-- Agregá esta línea acá
    private readonly getVitalSignsHistoryUseCase: GetVitalSignsHistoryUseCase,
  ) {}

  @Post('vital-signs')
  @Roles(UserRole.NURSE, UserRole.DOCTOR, UserRole.ADMIN)
  async recordVitalSigns(
    // 1. Agregamos el heartRate al tipo del body
    @Body() body: { patientId: string; temperature: number; bloodPressure: string; heartRate: number }
  ) {
    // 2. Armamos el objeto sin la palabra "new" porque es una interfaz
    const command: RecordVitalSignsCommand = {
      patientId: body.patientId,
      temperature: body.temperature,
      bloodPressure: body.bloodPressure,
      heartRate: body.heartRate, // Lo mapeamos acá
    };

    const result = await this.recordVitalSignsUseCase.execute(command);
    return { message: 'Signos vitales registrados con éxito', data: result };
  }

  @Post('protocols/generate')
  @Roles(UserRole.NURSE, UserRole.DOCTOR, UserRole.ADMIN)
  async generateProtocol(@Body() body: { patientId: string; admissionReason: string }) {
    // También arreglamos este por las dudas para que no tire error
    const command: GenerateProtocolCommand = {
      patientId: body.patientId,
      admissionReason: body.admissionReason,
    };
    
    const protocol = await this.generateCareProtocolUseCase.execute(command);
    return { message: 'Protocolo generado exitosamente', data: protocol };
  }
  @Post('medication/administer')
  @Roles(UserRole.NURSE, UserRole.ADMIN)
  async administerMedication(@Body() body: AdministerMedicationCommand) {
    const result = await this.administerMedicationUseCase.execute(body);
    return { message: 'Administración de medicación registrada con éxito', data: result };
  }

  @Get('vital-signs/:patientId')
  @Roles(UserRole.NURSE, UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT)
  async getVitalSignsHistory(@Param('patientId') patientId: string) {
    const history = await this.getVitalSignsHistoryUseCase.execute(patientId);
    return {
      message: 'Historial de signos vitales recuperado',
      data: history,
    };
  }
}



