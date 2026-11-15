export class CareProtocol {
    constructor(
        public readonly patientId: string,
        public readonly protocolType: string,
        public readonly tasks: string[] = [],
        public readonly isolationRequired: boolean = false,
    ) {}
}

export interface ICareProtocolBuilder {
    buildForPatient(patientId: string): CareProtocol;
}

// Builder Concreto 1: Pre-Quirúrgico
export class PreOpProtocolBuilder implements ICareProtocolBuilder {
    buildForPatient(patientId: string): CareProtocol {
        const tasks = [
            'Verificar ayuno de 8 horas',
            'Colocar vía intravenosa periférica',
            'Realizar control de signos vitales cada 2 horas',
        ];
        return new CareProtocol(patientId, 'INGRESO_PRE_QUIRURGICO', tasks, false);
    }
}

// Builder Concreto 2: Infección Respiratoria
export class RespiratoryProtocolBuilder implements ICareProtocolBuilder {
    buildForPatient(patientId: string): CareProtocol {
        const tasks = [
            'Monitoreo de saturación de oxígeno continuo',
            'Indicación de aislamiento de contacto y gotas',
        ];
        return new CareProtocol(patientId, 'INGRESO_INFECCION_RESPIRATORIA', tasks, true);
    }
}

// Builder Concreto 3: Cuadro Febril
export class FeverProtocolBuilder implements ICareProtocolBuilder {
    buildForPatient(patientId: string): CareProtocol {
        const tasks = [
            'Control de temperatura cada 1 hora',
            'Administrar antitérmicos (ej: Paracetamol) según prescripción',
            'Mantener hidratación adecuada y control de líquidos'
        ];
        return new CareProtocol(patientId, 'INGRESO_FIEBRE', tasks, false);
    }
}