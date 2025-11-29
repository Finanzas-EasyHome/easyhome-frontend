// src/modules/simulador/domain/entities/Simulacion.js

export class Simulacion {
    constructor(data = {}) {
        /** -------------------------
         *  CLIENTE
         * ------------------------- */
        this.clienteId = data.clienteId || data.cliente_id || null;
        this.clienteNombre = data.clienteNombre || data.cliente_nombre || '';

        /** -------------------------
         *  PROGRAMA
         * ------------------------- */
        this.programa = data.programa || data.programa_objetivo || '';

        /** -------------------------
         *  VIVIENDA
         * ------------------------- */
        this.valorVivienda = Number(
            data.valorVivienda ?? data.valor_vivienda ?? 0
        );

        this.cuotaInicial = Number(
            data.cuotaInicial ??
            data.cuota_inicial_monto ??
            data.cuota_inicial ??
            0
        );

        this.cuotaInicialPorcentaje = Number(
            data.cuotaInicialPorcentaje ??
            data.cuota_inicial_porcentaje ??
            0
        );

        this.montoBono = Number(
            data.montoBono ?? data.monto_bono ?? data.bono_monto ?? 0
        );

        this.montoFinanciado = Number(
            data.montoFinanciado ??
            data.monto_financiado ??
            data.saldo_financiar ??
            0
        );

        /** -------------------------
         *  PRÉSTAMO
         * ------------------------- */
        this.fechaInicioPago = data.fechaInicioPago || data.fecha_inicio_pago || null;

        this.tipoTasa = data.tipoTasa || data.tipo_tasa || 'TEA';
        this.tasaInteres = Number(
            data.tasaInteres ?? data.tasa_valor ?? data.tasa_interes ?? 0
        );
        this.tasaDescuento = Number(
            data.tasaDescuento ?? data.tasa_descuento ?? 0
        );

        this.plazoPrestamo = Number(
            data.plazoPrestamo ??
            data.plazo_valor ??
            data.plazo_prestamo ??
            0
        );

        this.plazoTipo = data.plazoTipo || data.plazo_tipo || 'meses';

        this.periodoGracia = Number(
            data.periodoGracia ??
            data.gracia_meses ??
            data.periodo_gracia ??
            0
        );

        this.tipoPeriodoGracia =
            data.tipoPeriodoGracia ||
            data.gracia_tipo ||
            data.tipo_periodo_gracia ||
            'ninguno';

        /** -------------------------
         *  COSTOS ADICIONALES
         * ------------------------- */
        this.entidadId =
            data.entidadId || data.entidad_id || data.entidad_financiera || null;

        this.seguroDesgravamen = Number(
            data.seguroDesgravamen ?? data.seguro_desgravamen ?? 0
        );
        this.seguroInmueble = Number(
            data.seguroInmueble ?? data.seguro_inmueble ?? 0
        );

        this.tasacion = Number(data.tasacion ?? data.tasacion_min ?? 0);
        this.gastosNotariales = Number(
            data.gastosNotariales ?? data.gastos_notariales ?? 0
        );
        this.gastosRegistrales = Number(
            data.gastosRegistrales ?? data.gastos_registrales ?? 0
        );

        this.cargosAdmin = Number(
            data.cargosAdmin ?? data.cargos_admin ?? 0
        );
        this.cargosAdministrativos = Number(
            data.cargosAdministrativos ??
            data.cargos_administrativos ??
            data.cargos_admin ??
            data.cargosAdmin ??
            0
        );
        this.comisionDesembolso = Number(
            data.comisionDesembolso ??
            data.comision_envio ??
            data.comision_desembolso ??
            0
        );

        /** -------------------------
         *  RESULTADOS
         * ------------------------- */
        this.cuotaMensual = Number(
            data.cuotaMensual ?? data.cuota ?? data.cuota_mensual ?? 0
        );
        this.totalIntereses = Number(
            data.totalIntereses ?? data.total_intereses ?? 0
        );
        this.tcea = Number(data.tcea ?? 0);
        this.van = Number(data.van ?? 0);
        this.tir = Number(data.tir ?? 0);

        this.cronogramaPagos =
            data.cronogramaPagos || data.cronograma_pagos || [];

        /** -------------------------
         *  META
         * ------------------------- */
        this.userId = data.userId || data.user_id || null;
        this.createdAt = data.createdAt || data.created_at || null;
        this.updatedAt = data.updatedAt || data.updated_at || null;
    }

    /** Factory */
    static create(data) {
        return new Simulacion(data);
    }

    /** -------------------------
     *  MÉTODOS DE NEGOCIO
     * ------------------------- */

    // Lo llama CalcularSimulacion
    calculateMontoFinanciado() {
        // Saldo base
        const saldo =
            (this.valorVivienda || 0) -
            (this.cuotaInicial || 0) -
            (this.montoBono || 0);

        // Costos que sí se financian
        const tasacion = this.tasacion || 0;
        const gastosNotariales = this.gastosNotariales || 0;
        const gastosRegistrales = this.gastosRegistrales || 0;

        // Monto final del préstamo (saldo + costos financiables)
        this.montoFinanciado =
            saldo +
            tasacion +
            gastosNotariales +
            gastosRegistrales;

        return this.montoFinanciado;
    }

    /** Validaciones */
    validate() {
        const errors = [];

        if (!this.clienteId) errors.push('Debe seleccionar un cliente.');
        if (!this.programa) errors.push('Debe elegir un programa.');

        if (this.valorVivienda <= 0)
            errors.push('El valor de la vivienda debe ser mayor a 0.');

        if (this.cuotaInicial < 0)
            errors.push('La cuota inicial no puede ser negativa.');

        if (this.cuotaInicial >= this.valorVivienda)
            errors.push(
                'La cuota inicial no puede ser mayor o igual al valor de la vivienda.'
            );

        if (!this.entidadId)
            errors.push('Debe seleccionar una entidad financiera.');

        if (this.tasaInteres <= 0)
            errors.push('La tasa de interés debe ser mayor a 0.');

        if (!this.fechaInicioPago)
            errors.push('Debe elegir la fecha de inicio de pago.');

        if (this.plazoPrestamo <= 0)
            errors.push('Debe indicar el plazo del préstamo.');

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /** -------------------------
     *  Conversión a JSON (Supabase)
     * ------------------------- */
    toJSON() {
        return {
            user_id: this.userId,

            entidad_id: this.entidadId,
            cliente_tp_id: this.clienteId,

            programa: this.programa,
            valor_vivienda: this.valorVivienda,

            cuota_inicial_porcentaje: this.cuotaInicialPorcentaje,
            cuota_inicial_monto: this.cuotaInicial,

            bono_monto: this.montoBono,
            saldo_financiar: this.montoFinanciado,

            tipo_tasa: this.tipoTasa,
            tasa_valor: this.tasaInteres,
            tasa_descuento: this.tasaDescuento,

            seguro_desgravamen: this.seguroDesgravamen,
            seguro_inmueble: this.seguroInmueble,
            cargos_admin: this.cargosAdmin,
            tasacion: this.tasacion,
            gastos_notariales: this.gastosNotariales,
            gastos_registrales: this.gastosRegistrales,
            comision_envio: this.comisionDesembolso,

            plazo_tipo: this.plazoTipo,
            plazo_valor: this.plazoPrestamo,
            gracia_tipo: this.tipoPeriodoGracia,
            gracia_meses: this.periodoGracia,

            fecha_inicio_pago: this.fechaInicioPago,
            fecha_creacion: this.createdAt || new Date().toISOString(),

            cuota: this.cuotaMensual,
            tcea: this.tcea,
            van: this.van,
            tir: this.tir,

            cronograma_pagos: this.cronogramaPagos
        };
    }
}
