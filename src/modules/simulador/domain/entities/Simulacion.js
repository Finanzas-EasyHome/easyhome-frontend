// src/modules/simulador/domain/entities/Simulacion.js

/**
 * Entidad Simulacion - Representa una simulación de plan de pagos
 */
export class Simulacion {
    constructor(data = {}) {
        // Datos del cliente
        this.clienteId = data.clienteId || null;
        this.clienteNombre = data.clienteNombre || '';

        // Datos del programa
        this.programaObjetivo = data.programaObjetivo || '';

        // Datos financieros
        this.cuotaInicial = data.cuotaInicial || 0;
        this.cuotaInicialPorcentaje = data.cuotaInicialPorcentaje || 0;
        this.valorVivienda = data.valorVivienda || 0;
        this.montoBono = data.montoBono || 0;
        this.montoFinanciado = data.montoFinanciado || 0;

        // Parámetros del préstamo
        this.fechaInicioPago = data.fechaInicioPago || null;
        this.tipoTasa = data.tipoTasa || 'TEA'; // Solo TEA
        this.tasaInteres = data.tasaInteres || 0;
        this.plazoPrestamo = data.plazoPrestamo || 0;
        this.periodoGracia = data.periodoGracia || 0;
        this.tipoPeriodoGracia = data.tipoPeriodoGracia || 'ninguno'; // 'ninguno', 'total', 'parcial'

        // Costos adicionales
        this.entidadFinanciera = data.entidadFinanciera || '';
        this.seguroDesgravamen = data.seguroDesgravamen || 0;
        this.tasacion = data.tasacion || 0;
        this.seguroInmueble = data.seguroInmueble || 0;
        this.gastosNotariales = data.gastosNotariales || 0;
        this.comisionDesembolso = data.comisionDesembolso || 0;

        // Resultados
        this.cuotaMensual = data.cuotaMensual || 0;
        this.totalIntereses = data.totalIntereses || 0;
        this.tcea = data.tcea || 0;
        this.van = data.van || 0;
        this.tir = data.tir || 0;
        this.cronogramaPagos = data.cronogramaPagos || [];

        // Metadatos
        this.userId = data.userId || null;
        this.createdAt = data.createdAt || null;
        this.updatedAt = data.updatedAt || null;
    }

    /**
     * Crea una nueva instancia de Simulacion
     */
    static create(data) {
        return new Simulacion(data);
    }

    /**
     * Valida los datos de la simulación
     */
    validate() {
        const errors = [];

        // Validar campos requeridos
        if (!this.clienteNombre || this.clienteNombre.trim() === '') {
            errors.push('El nombre del cliente es requerido');
        }

        if (!this.programaObjetivo || this.programaObjetivo.trim() === '') {
            errors.push('El programa objetivo es requerido');
        }

        if (!this.valorVivienda || this.valorVivienda <= 0) {
            errors.push('El valor de la vivienda debe ser mayor a 0');
        }

        if (!this.cuotaInicial || this.cuotaInicial < 0) {
            errors.push('La cuota inicial no puede ser negativa');
        }

        if (this.cuotaInicial >= this.valorVivienda) {
            errors.push('La cuota inicial debe ser menor al valor de la vivienda');
        }

        if (!this.fechaInicioPago) {
            errors.push('La fecha de inicio de pago es requerida');
        }

        if (!this.tasaInteres || this.tasaInteres <= 0) {
            errors.push('La tasa de interés debe ser mayor a 0');
        }

        if (this.tasaInteres > 100) {
            errors.push('La tasa de interés no puede ser mayor a 100%');
        }

        if (!this.plazoPrestamo || this.plazoPrestamo < 60 || this.plazoPrestamo > 300) {
            errors.push('El plazo del préstamo debe estar entre 5 y 25 años (60 a 300 meses)');
        }

        if (!this.entidadFinanciera || this.entidadFinanciera === '') {
            errors.push('La entidad financiera es requerida');
        }

        // Validar periodo de gracia
        if (this.periodoGracia < 0) {
            errors.push('El periodo de gracia no puede ser negativo');
        }

        if (this.periodoGracia > 0 && !['total', 'parcial'].includes(this.tipoPeriodoGracia)) {
            errors.push('Debe especificar el tipo de periodo de gracia (total o parcial)');
        }

        if (this.periodoGracia > 12) {
            errors.push('El periodo de gracia no puede ser mayor a 12 meses');
        }

        if (this.periodoGracia >= this.plazoPrestamo) {
            errors.push('El periodo de gracia debe ser menor al plazo del préstamo');
        }

        // Validar tipo de tasa
        if (this.tipoTasa !== 'TEA') {
            errors.push('Solo se admite TEA como tipo de tasa');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Calcula el monto financiado
     */
    calculateMontoFinanciado() {
        this.montoFinanciado = this.valorVivienda - this.cuotaInicial - this.montoBono;
        return this.montoFinanciado;
    }

    /**
     * Convierte la entidad a JSON
     */
    toJSON() {
        return {
            clienteId: this.clienteId,
            clienteNombre: this.clienteNombre,
            programaObjetivo: this.programaObjetivo,
            cuotaInicial: this.cuotaInicial,
            cuotaInicialPorcentaje: this.cuotaInicialPorcentaje,
            valorVivienda: this.valorVivienda,
            montoBono: this.montoBono,
            montoFinanciado: this.montoFinanciado,
            fechaInicioPago: this.fechaInicioPago,
            tipoTasa: this.tipoTasa,
            tasaInteres: this.tasaInteres,
            plazoPrestamo: this.plazoPrestamo,
            periodoGracia: this.periodoGracia,
            tipoPeriodoGracia: this.tipoPeriodoGracia,
            entidadFinanciera: this.entidadFinanciera,
            seguroDesgravamen: this.seguroDesgravamen,
            tasacion: this.tasacion,
            seguroInmueble: this.seguroInmueble,
            gastosNotariales: this.gastosNotariales,
            comisionDesembolso: this.comisionDesembolso,
            cuotaMensual: this.cuotaMensual,
            totalIntereses: this.totalIntereses,
            tcea: this.tcea,
            van: this.van,
            tir: this.tir,
            cronogramaPagos: this.cronogramaPagos,
            userId: this.userId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}