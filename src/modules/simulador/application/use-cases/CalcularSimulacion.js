// src/modules/simulador/application/use-cases/CalcularSimulacion.js

import { Simulacion } from '/src/modules/simulador/domain/entities/Simulacion.js';

/**
 * Caso de uso: Calcular Simulación de Plan de Pagos
 * Implementación del Método Francés según documento de Finanzas e Ingeniería Económica
 *
 * ESTRUCTURA DEL CRONOGRAMA (según Excel de referencia):
 * =====================================================
 * - N° (Número de cuota)
 * - TEA (Tasa Efectiva Anual)
 * - i' = TEP = TEM (Tasa Efectiva del Período)
 * - P.G. (Período de Gracia: P=Parcial, T=Total, S=Sin gracia)
 * - Saldo Inicial
 * - Interés
 * - Cuota (inc Seg Des) - Cuota incluyendo Seguro Desgravamen
 * - Amort. (Amortización)
 * - Seguro desgrav (Seguro de Desgravamen)
 * - Seguro riesgo (Seguro de Inmueble)
 * - Comisión
 * - Portes
 * - Gastos Adm. (Gastos Administrativos)
 * - Saldo Final
 * - Flujo (Flujo de caja del período)
 *
 * FLUJO DE CAJA:
 * - Flujo 0: +Monto del Préstamo (POSITIVO - cliente recibe dinero)
 * - Flujo 1-N: -Pagos (NEGATIVO - cliente paga cuotas)
 *
 * INDICADORES:
 * - TDP = (1 + COK)^(30/360) - 1
 * - TIR = Tasa que hace VAN = 0
 * - TCEA = ((1 + TIR)^12) - 1
 * - VAN = Σ(Flujo_i / (1 + TDP)^i)
 */
export class CalcularSimulacion {
    constructor(repository) {
        this.repository = repository;
    }

    async execute(simData) {
        try {
            // 1️⃣ Crear entidad de dominio
            const simulacion = new Simulacion(simData);

            // 2️⃣ Validar datos
            const validation = simulacion.validate();
            if (!validation.valid) {
                throw new Error(validation.errors.join(', '));
            }

            // 3️⃣ Calcular monto financiado base
            simulacion.calculateMontoFinanciado();

            // 4️⃣ Sincronizar ENTRADA para cálculos
            this.sincronizarEntrada(simulacion);

            // 5️⃣ Calcular Monto del Préstamo (incluye costos iniciales)
            this.calcularMontoPrestamo(simulacion);

            // 6️⃣ Calcular cuota y cronograma (método francés)
            this.calcularCuotaYCronograma(simulacion);

            // 7️⃣ Calcular indicadores financieros (TCEA, VAN, TIR)
            this.calcularIndicadoresFinancieros(simulacion);

            // 8️⃣ Sincronizar SALIDA
            this.sincronizarSalida(simulacion);

            return simulacion;

        } catch (error) {
            console.error("Error en CalcularSimulacion:", error);
            throw error;
        }
    }

    /**
     * Sincronizar campos de entrada
     */
    sincronizarEntrada(sim) {
        // Datos de la vivienda
        sim.valorVivienda = Number(sim.valor_vivienda ?? sim.valorVivienda ?? 0);
        sim.cuotaInicial = Number(sim.cuota_inicial ?? sim.cuotaInicial ?? 0);
        sim.cuotaInicialPorcentaje = Number(sim.cuota_inicial_porcentaje ?? sim.cuotaInicialPorcentaje ?? 0);
        sim.montoBono = Number(sim.monto_bono ?? sim.montoBono ?? 0);

        // Saldo a financiar (valor - cuota inicial - bono)
        sim.saldoFinanciar = Number(sim.monto_financiado ?? sim.montoFinanciado ?? sim.saldo_financiar ?? 0);

        // Datos del préstamo
        sim.tasaInteres = Number(sim.tasa_interes ?? sim.tasaInteres ?? 0); // TEA en %
        sim.tasaDescuentoCOK = Number(sim.tasa_descuento ?? sim.tasaDescuento ?? 12); // COK en %
        sim.plazoPrestamo = Number(sim.plazo_prestamo ?? sim.plazoPrestamo ?? 0); // en meses

        // Período de gracia
        sim.periodoGracia = Number(sim.periodo_gracia ?? sim.periodoGracia ?? 0);
        sim.tipoPeriodoGracia = sim.tipo_periodo_gracia ?? sim.tipoPeriodoGracia ?? 'ninguno';

        // Fecha de inicio
        sim.fechaInicioPago = sim.fecha_inicio_pago ?? sim.fechaInicioPago;

        // =============================================
        // COSTOS INICIALES (se suman al préstamo)
        // =============================================
        sim.tasacion = Number(sim.tasacion ?? 0);
        sim.gastosNotariales = Number(sim.gastos_notariales ?? sim.gastosNotariales ?? 0);
        sim.gastosRegistrales = Number(sim.gastos_registrales ?? sim.gastosRegistrales ?? 0);

        // =============================================
        // COSTOS PERIÓDICOS (porcentajes)
        // =============================================
        // Seguro de desgravamen - viene como porcentaje mensual (ej: 0.0004 = 0.04%)
        sim.seguroDesgravamenPorcentaje = Number(sim.seguro_desgravamen ?? sim.seguroDesgravamen ?? 0);

        // Seguro de inmueble/riesgo - viene como porcentaje anual (ej: 0.000256 = 0.0256%)
        sim.seguroInmuebleAnual = Number(sim.seguro_inmueble ?? sim.seguroInmueble ?? 0);

        // =============================================
        // OTROS COSTOS PERIÓDICOS (montos fijos por período)
        // IMPORTANTE: Gastos Admin es POR PERÍODO (mensual), no anual
        // =============================================
        sim.cargosAdministrativos = Number(sim.cargos_administrativos ?? sim.cargosAdministrativos ?? sim.cargos_admin ?? 0);
        sim.comision = Number(sim.comision ?? sim.comision_desembolso ?? sim.comisionDesembolso ?? 0);
        sim.portes = Number(sim.portes ?? 0);

        // Parámetros de cálculo
        sim.diasPorAnio = 360;
        sim.frecuenciaPago = 30; // mensual
        sim.cuotasPorAnio = 12;
    }

    /**
     * Calcular Monto del Préstamo
     * Monto Préstamo = Saldo a Financiar + Costos Iniciales
     */
    calcularMontoPrestamo(sim) {
        // Costos iniciales según el documento
        sim.costosIniciales = sim.tasacion + sim.gastosNotariales + sim.gastosRegistrales;

        // Monto del préstamo = Saldo a financiar + Costos iniciales
        sim.montoPrestamo = sim.saldoFinanciar + sim.costosIniciales;

        // También actualizar montoFinanciado para mostrar en la UI
        sim.montoFinanciado = sim.montoPrestamo;

        console.log("=== MONTO PRÉSTAMO ===");
        console.log("Saldo a Financiar:", sim.saldoFinanciar);
        console.log("Costos Iniciales:", sim.costosIniciales);
        console.log("MONTO PRÉSTAMO:", sim.montoPrestamo);
    }

    /**
     * Sincronizar resultados de salida
     */
    sincronizarSalida(sim) {
        sim.cuota_mensual = sim.cuotaMensual;
        sim.total_intereses = sim.totalIntereses;
        sim.cronograma_pagos = sim.cronogramaPagos;
        sim.monto_financiado = sim.montoPrestamo;
    }

    /**
     * MÉTODO FRANCÉS - Cálculo del cronograma
     */
    calcularCuotaYCronograma(sim) {
        const montoPrestamo = sim.montoPrestamo;
        const plazo = sim.plazoPrestamo;
        const gMeses = sim.periodoGracia;
        const gTipo = sim.tipoPeriodoGracia;

        // ============================================
        // 1. CALCULAR TEP (Tasa Efectiva del Período)
        // TEP = (1 + TEA)^(30/360) - 1
        // ============================================
        const TEA = sim.tasaInteres / 100;
        const TEP = Math.pow(1 + TEA, sim.frecuenciaPago / sim.diasPorAnio) - 1;

        console.log("=== TASAS ===");
        console.log("TEA:", sim.tasaInteres + "%");
        console.log("TEP:", (TEP * 100).toFixed(5) + "%");

        // ============================================
        // 2. SEGURO DE DESGRAVAMEN POR PERÍODO
        // ============================================
        const seguroDesgravamenPeriodo = sim.seguroDesgravamenPorcentaje;

        // ============================================
        // 3. SEGURO DE RIESGO/INMUEBLE POR PERÍODO
        // SegRiesgo = (%anual * valorVivienda) / 12
        // ============================================
        const seguroRiesgoPeriodo = (sim.seguroInmuebleAnual * sim.valorVivienda) / sim.cuotasPorAnio;

        // ============================================
        // 4. GASTOS ADMINISTRATIVOS POR PERÍODO
        // En el Excel es S/ 10.00 por período (mensual)
        // ============================================
        const gastosAdminPeriodo = sim.cargosAdministrativos;
        const comisionPeriodo = sim.comision;
        const portesPeriodo = sim.portes;

        console.log("=== COSTOS PERIÓDICOS ===");
        console.log("Seguro Desgravamen:", (seguroDesgravamenPeriodo * 100).toFixed(4) + "%");
        console.log("Seguro Riesgo: S/", seguroRiesgoPeriodo.toFixed(2));
        console.log("Gastos Admin: S/", gastosAdminPeriodo.toFixed(2));
        console.log("Comisión: S/", comisionPeriodo.toFixed(2));
        console.log("Portes: S/", portesPeriodo.toFixed(2));

        // ============================================
        // 5. GENERAR CRONOGRAMA
        // ============================================
        const cronograma = [];
        const fechaInicio = new Date(sim.fechaInicioPago);

        let saldoInicial = montoPrestamo;

        // FLUJOS: Flujo 0 = +Préstamo (positivo)
        let flujos = [montoPrestamo];

        // Variables para totales
        let totalIntereses = 0;
        let totalAmortizacion = 0;
        let totalSeguroDesgravamen = 0;
        let totalSeguroRiesgo = 0;
        let totalGastosAdmin = 0;

        for (let nc = 1; nc <= plazo; nc++) {
            const fechaPago = new Date(fechaInicio);
            fechaPago.setMonth(fechaPago.getMonth() + nc);

            const SII = saldoInicial;

            // Interés = SII × TEP
            const interes = SII * TEP;

            // Seguro Desgravamen = SII × %SegDes
            const seguroDesgravamen = SII * seguroDesgravamenPeriodo;

            let cuotaConSegDes = 0;  // Cuota incluyendo Seg Desgravamen
            let amortizacion = 0;
            let saldoFinal = 0;
            let periodoGraciaLabel = 'S';  // S = Sin gracia

            // ============================================
            // PERÍODO DE GRACIA
            // ============================================
            if (nc <= gMeses) {
                if (gTipo === "total") {
                    // GRACIA TOTAL: No paga nada, intereses se capitalizan
                    periodoGraciaLabel = 'T';
                    cuotaConSegDes = 0;
                    amortizacion = 0;
                    saldoFinal = SII + interes;
                } else if (gTipo === "parcial") {
                    // GRACIA PARCIAL: Solo paga intereses + seguro desgravamen
                    periodoGraciaLabel = 'P';
                    cuotaConSegDes = interes + seguroDesgravamen;
                    amortizacion = 0;
                    saldoFinal = SII;
                }
            } else {
                // ============================================
                // CUOTA NORMAL (Método Francés con Seguro)
                // Cuota = SII × [(TEP + %SegDes) × (1 + TEP + %SegDes)^n] / [(1 + TEP + %SegDes)^n - 1]
                // ============================================
                periodoGraciaLabel = 'S';
                const cuotasRestantes = plazo - nc + 1;
                const tasaConSeguro = TEP + seguroDesgravamenPeriodo;
                const factor = Math.pow(1 + tasaConSeguro, cuotasRestantes);

                cuotaConSegDes = SII * (tasaConSeguro * factor) / (factor - 1);
                amortizacion = cuotaConSegDes - interes - seguroDesgravamen;
                saldoFinal = SII - amortizacion;

                if (saldoFinal < 0.01) saldoFinal = 0;
            }

            // ============================================
            // FLUJO = -(Cuota + SegRiesgo + Comisión + Portes + GastosAdmin)
            // NEGATIVO porque es pago que sale del cliente
            // ============================================
            const flujoNeto = -(cuotaConSegDes + seguroRiesgoPeriodo + comisionPeriodo + portesPeriodo + gastosAdminPeriodo);

            // Acumular totales
            totalIntereses += interes;
            totalAmortizacion += amortizacion;
            totalSeguroDesgravamen += seguroDesgravamen;
            totalSeguroRiesgo += seguroRiesgoPeriodo;
            totalGastosAdmin += gastosAdminPeriodo;

            // Agregar al cronograma con TODOS los campos del Excel
            cronograma.push({
                numeroCuota: nc,
                fechaPago: fechaPago.toISOString().split("T")[0],
                TEA: sim.tasaInteres,
                TEP: this.redondear5(TEP * 100),
                periodoGracia: periodoGraciaLabel,
                saldoInicial: this.redondear2(SII),
                interes: this.redondear2(interes),
                cuotaConSegDes: this.redondear2(cuotaConSegDes),
                amortizacion: this.redondear2(amortizacion),
                seguroDesgravamen: this.redondear2(seguroDesgravamen),
                seguroRiesgo: this.redondear2(seguroRiesgoPeriodo),
                comision: this.redondear2(comisionPeriodo),
                portes: this.redondear2(portesPeriodo),
                gastosAdmin: this.redondear2(gastosAdminPeriodo),
                saldoFinal: this.redondear2(saldoFinal),
                flujo: this.redondear2(flujoNeto),

                // Campos adicionales para compatibilidad
                cuotaBase: this.redondear2(cuotaConSegDes),
                cuotaTotal: this.redondear2(cuotaConSegDes + seguroRiesgoPeriodo),
                seguros: this.redondear2(seguroDesgravamen + seguroRiesgoPeriodo),
                enPeriodoGracia: nc <= gMeses,
                tipoPeriodoGracia: nc <= gMeses ? gTipo : null
            });

            // Agregar flujo (negativo)
            flujos.push(flujoNeto);

            // Actualizar saldo
            saldoInicial = saldoFinal;
        }

        // Guardar resultados
        sim.cronogramaPagos = cronograma;
        sim.totalIntereses = this.redondear2(totalIntereses);
        sim.totalAmortizacion = this.redondear2(totalAmortizacion);
        sim.totalSeguroDesgravamen = this.redondear2(totalSeguroDesgravamen);
        sim.totalSeguroRiesgo = this.redondear2(totalSeguroRiesgo);
        sim.totalGastosAdmin = this.redondear2(totalGastosAdmin);
        sim.flujos = flujos;

        // Cuota mensual (primera cuota normal)
        const cuotasNormales = cronograma.filter(c => !c.enPeriodoGracia);
        sim.cuotaMensual = cuotasNormales.length > 0
            ? this.redondear2(cuotasNormales[0].cuotaTotal)
            : 0;

        // Guardar TEP calculado
        sim.TEP = TEP;
        sim.seguroRiesgoPeriodo = seguroRiesgoPeriodo;

        console.log("=== CUOTAS ===");
        console.log("Cuota Gracia (1-3):", cronograma[0]?.cuotaConSegDes);
        console.log("Cuota Normal (4+):", cronograma[3]?.cuotaConSegDes);
        console.log("Flujo Gracia:", cronograma[0]?.flujo);
        console.log("Flujo Normal:", cronograma[3]?.flujo);
    }

    /**
     * CÁLCULO DE INDICADORES FINANCIEROS
     */
    calcularIndicadoresFinancieros(sim) {
        const flujos = sim.flujos;

        console.log("=== INDICADORES ===");
        console.log("COK:", sim.tasaDescuentoCOK + "%");

        // ============================================
        // 1. TASA DE DESCUENTO DEL PERÍODO
        // TDP = (1 + COK)^(30/360) - 1
        // ============================================
        const COK = sim.tasaDescuentoCOK / 100;
        const TDP = Math.pow(1 + COK, sim.frecuenciaPago / sim.diasPorAnio) - 1;

        sim.tasaDescuentoPeriodo = TDP;
        console.log("TDP:", (TDP * 100).toFixed(5) + "%");

        // ============================================
        // 2. TIR (Tasa Interna de Retorno)
        // Flujos: [+Préstamo, -Pago1, -Pago2, ..., -PagoN]
        // ============================================
        const tirPeriodo = this.calcularTIR(flujos);
        sim.tir = this.redondear5(tirPeriodo * 100);
        console.log("TIR:", sim.tir + "%");

        // ============================================
        // 3. TCEA = ((1 + TIR)^12) - 1
        // ============================================
        const tcea = Math.pow(1 + tirPeriodo, sim.cuotasPorAnio) - 1;
        sim.tcea = this.redondear4(tcea * 100);
        console.log("TCEA:", sim.tcea + "%");

        // ============================================
        // 4. VAN = Σ(Flujo_i / (1 + TDP)^i)
        // ============================================
        let van = 0;
        for (let i = 0; i < flujos.length; i++) {
            van += flujos[i] / Math.pow(1 + TDP, i);
        }
        sim.van = this.redondear2(van);
        console.log("VAN: S/", sim.van);
    }

    /**
     * Calcular TIR usando Newton-Raphson
     */
    calcularTIR(flujos, tolerancia = 0.0000001, maxIteraciones = 1000) {
        let tir = 0.01;

        for (let iter = 0; iter < maxIteraciones; iter++) {
            let van = 0;
            let derivada = 0;

            for (let j = 0; j < flujos.length; j++) {
                const factor = Math.pow(1 + tir, j);
                van += flujos[j] / factor;

                if (j > 0) {
                    derivada -= j * flujos[j] / Math.pow(1 + tir, j + 1);
                }
            }

            if (Math.abs(derivada) < 1e-12) break;

            const nuevaTir = tir - van / derivada;

            if (Math.abs(nuevaTir - tir) < tolerancia) {
                return nuevaTir;
            }

            if (nuevaTir < -0.99) tir = -0.5;
            else if (nuevaTir > 10) tir = 0.5;
            else tir = nuevaTir;
        }

        return tir;
    }

    redondear2(v) {
        if (!isFinite(v)) return 0;
        return Math.round(v * 100) / 100;
    }

    redondear4(v) {
        if (!isFinite(v)) return 0;
        return Math.round(v * 10000) / 10000;
    }

    redondear5(v) {
        if (!isFinite(v)) return 0;
        return Math.round(v * 100000) / 100000;
    }
}