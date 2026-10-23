import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
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
    private readonly administerMedicationUseCase: AdministerMedicationUseCase,
    private readonly getVitalSignsHistoryUseCase: GetVitalSignsHistoryUseCase,
  ) {}

  @Post('vital-signs')
  @Roles(UserRole.NURSE, UserRole.DOCTOR, UserRole.ADMIN)
  async recordVitalSigns(
    @Body() body: { patientId: string; temperature: number; bloodPressure: string; heartRate: number }
  ) {
    const command: RecordVitalSignsCommand = {
      patientId: body.patientId,
      temperature: body.temperature,
      bloodPressure: body.bloodPressure,
      heartRate: body.heartRate,
    };

    const result = await this.recordVitalSignsUseCase.execute(command);
    return { message: 'Signos vitales registrados con éxito', data: result };
  }

  @Post('protocols/generate')
  @Roles(UserRole.NURSE, UserRole.DOCTOR, UserRole.ADMIN)
  async generateProtocol(@Body() body: { patientId: string; admissionReason: string }) {
    const command: GenerateProtocolCommand = {
      patientId: body.patientId,
      admissionReason: body.admissionReason,
    };
    
    const protocol = await this.generateCareProtocolUseCase.execute(command);
    return { message: 'Protocolo generado exitosamente', data: protocol };
  }

  @Post('medication/administer')
  @Roles(UserRole.NURSE, UserRole.ADMIN)
  async administerMedication(
    @Req() req: any, // Inyectamos la request
    @Body() body: AdministerMedicationCommand
  ) {
    // 1. Extraemos el ID del usuario del token JWT (suele venir como id o sub según cómo armaron el payload)
    const authenticatedNurseId = req.user.id || req.user.sub;

    // 2. Sobrescribimos el nurseId que pueda venir en el body con el real y seguro
    const secureCommand: AdministerMedicationCommand = {
      ...body,
      nurseId: authenticatedNurseId,
    };

    const result = await this.administerMedicationUseCase.execute(secureCommand);
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