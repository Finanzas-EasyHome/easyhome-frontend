// src/modules/simulador/domain/entities/Simulacion.js

export class Simulacion {
    constructor(data = {}) {

        /** -------------------------
         *  DATOS DEL CLIENTE
         * ------------------------- */
        this.cliente_id = data.cliente_id || null;     // UUID real en Supabase
        this.cliente_nombre = data.cliente_nombre || '';

        /** -------------------------
         *  PROGRAMA
         * ------------------------- */
        this.programa_objetivo = data.programa_objetivo || '';

        /** -------------------------
         *  DATOS FINANCIEROS
         * ------------------------- */
        this.valor_vivienda = data.valor_vivienda || 0;
        this.cuota_inicial = data.cuota_inicial || 0;
        this.cuota_inicial_porcentaje = data.cuota_inicial_porcentaje || 0;
        this.monto_bono = data.monto_bono || 0;
        this.monto_financiado = data.monto_financiado || 0;

        /** -------------------------
         *  PRÉSTAMO
         * ------------------------- */
        this.fecha_inicio_pago = data.fecha_inicio_pago || null;
        this.tipo_tasa = data.tipo_tasa || 'TEA';
        this.tasa_interes = data.tasa_interes || 0;
        this.plazo_prestamo = data.plazo_prestamo || 0;

        this.periodo_gracia = data.periodo_gracia || 0;
        this.tipo_periodo_gracia = data.tipo_periodo_gracia || 'ninguno';

        /** -------------------------
         *  COSTOS ADICIONALES
         * ------------------------- */
        this.entidad_financiera = data.entidad_financiera || '';
        this.seguro_desgravamen = data.seguro_desgravamen || 0;
        this.tasacion = data.tasacion || 0;
        this.seguro_inmueble = data.seguro_inmueble || 0;
        this.gastos_notariales = data.gastos_notariales || 0;
        this.comision_desembolso = data.comision_desembolso || 0;

        /** -------------------------
         *  RESULTADOS
         * ------------------------- */
        this.cuota_mensual = data.cuota_mensual || 0;
        this.total_intereses = data.total_intereses || 0;
        this.tcea = data.tcea || 0;
        this.van = data.van || 0;
        this.tir = data.tir || 0;

        // Cronograma se guarda como JSON en Supabase
        this.cronograma_pagos = data.cronograma_pagos || [];

        /** -------------------------
         *  META
         * ------------------------- */
        this.user_id = data.user_id || null;
        this.created_at = data.created_at || null;
        this.updated_at = data.updated_at || null;
    }

    /** Crear una instancia */
    static create(data) {
        return new Simulacion(data);
    }

    /** Validaciones */
    validate() {
        const errors = [];

        if (!this.cliente_nombre.trim()) errors.push('El nombre del cliente es requerido');
        if (!this.programa_objetivo.trim()) errors.push('El programa objetivo es requerido');
        if (!this.valor_vivienda || this.valor_vivienda <= 0)
            errors.push('El valor de la vivienda debe ser mayor a 0');

        if (this.cuota_inicial < 0) errors.push('La cuota inicial no puede ser negativa');
        if (this.cuota_inicial >= this.valor_vivienda)
            errors.push('La cuota inicial no puede ser mayor o igual al valor de la vivienda');

        if (!this.fecha_inicio_pago) errors.push('La fecha de inicio de pago es requerida');

        if (this.tasa_interes <= 0) errors.push('La tasa de interés debe ser mayor a 0');
        if (this.tasa_interes > 100) errors.push('La tasa no puede ser > 100%');

        if (this.plazo_prestamo < 60 || this.plazo_prestamo > 300)
            errors.push('El plazo debe estar entre 60 y 300 meses');

        if (!this.entidad_financiera) errors.push('Debe elegir una entidad financiera');

        if (this.periodo_gracia < 0) errors.push('El periodo de gracia no puede ser negativo');
        if (this.periodo_gracia > 12) errors.push('El periodo de gracia no puede ser > 12 meses');

        if (this.periodo_gracia > 0 &&
            !['total', 'parcial'].includes(this.tipo_periodo_gracia))
            errors.push('Debe indicar tipo de periodo de gracia');

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /** Calcula monto financiado */
    calculateMontoFinanciado() {
        this.monto_financiado =
            this.valor_vivienda - this.cuota_inicial - this.monto_bono;
        return this.monto_financiado;
    }

    /** Convertir a JSON para Supabase */
    toJSON() {
        return {
            cliente_id: this.cliente_id,
            cliente_nombre: this.cliente_nombre,
            programa_objetivo: this.programa_objetivo,
            valor_vivienda: this.valor_vivienda,
            cuota_inicial: this.cuota_inicial,
            cuota_inicial_porcentaje: this.cuota_inicial_porcentaje,
            monto_bono: this.monto_bono,
            monto_financiado: this.monto_financiado,
            fecha_inicio_pago: this.fecha_inicio_pago,
            tipo_tasa: this.tipo_tasa,
            tasa_interes: this.tasa_interes,
            plazo_prestamo: this.plazo_prestamo,
            periodo_gracia: this.periodo_gracia,
            tipo_periodo_gracia: this.tipo_periodo_gracia,

            entidad_financiera: this.entidad_financiera,
            seguro_desgravamen: this.seguro_desgravamen,
            tasacion: this.tasacion,
            seguro_inmueble: this.seguro_inmueble,
            gastos_notariales: this.gastos_notariales,
            comision_desembolso: this.comision_desembolso,

            cuota_mensual: this.cuota_mensual,
            total_intereses: this.total_intereses,
            tcea: this.tcea,
            van: this.van,
            tir: this.tir,
            cronograma_pagos: this.cronograma_pagos,

            user_id: this.user_id,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

