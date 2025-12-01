// src/modules/simulador/application/use-cases/CalcularSimulacion.js

import { Simulacion } from '/src/modules/simulador/domain/entities/Simulacion.js';

/**
 * Caso de uso: Calcular Simulación de Plan de Pagos
 * Implementación del Método Francés según documento de Finanzas e Ingeniería Económica
 * Adaptado a fórmulas de Excel proporcionadas
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
            // Ya no llamamos a simulacion.calculateMontoFinanciado()
            // porque lo haremos directamente en calcularMontoPrestamo()

            // 4️⃣ Sincronizar ENTRADA para cálculos
            this.sincronizarEntrada(simulacion);

            // 5️⃣ Calcular Monto del Préstamo (incluye costos iniciales)
            this.calcularMontoPrestamo(simulacion);

            // 6️⃣ Calcular cuota y cronograma (método francés)
            this.calcularCuotaYCronograma(simulacion);

            // 6️⃣ Calcular indicadores financieros (TCEA, VAN, TIR)
            this.calcularIndicadoresFinancieros(simulacion);

            // 7️⃣ Sincronizar SALIDA
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
        sim.cuotaInicial = Number(sim.cuota_inicial ?? sim.cuotaInicial ?? sim.cuota_inicial_monto ?? 0);
        sim.cuotaInicialPorcentaje = Number(sim.cuota_inicial_porcentaje ?? sim.cuotaInicialPorcentaje ?? 0);
        sim.montoBono = Number(sim.monto_bono ?? sim.montoBono ?? sim.bono_monto ?? 0);

        // =============================================
        // CALCULAR SALDO A FINANCIAR
        // Saldo a Financiar = Valor Vivienda - Cuota Inicial - Bono
        // =============================================
        sim.saldoFinanciar = sim.valorVivienda - sim.cuotaInicial - sim.montoBono;

        // Datos del préstamo
        sim.tasaInteres = Number(sim.tasa_interes ?? sim.tasaInteres ?? sim.tasa_valor ?? 0); // TEA en %
        sim.tasaDescuentoCOK = Number(sim.tasa_descuento ?? sim.tasaDescuento ?? 12); // COK en %
        sim.plazoPrestamo = Number(sim.plazo_prestamo ?? sim.plazoPrestamo ?? sim.plazo_valor ?? 0); // en meses

        // Período de gracia
        sim.periodoGracia = Number(sim.periodo_gracia ?? sim.periodoGracia ?? sim.gracia_meses ?? 0);
        sim.tipoPeriodoGracia = sim.tipo_periodo_gracia ?? sim.tipoPeriodoGracia ?? sim.gracia_tipo ?? 'ninguno';

        // Fecha de inicio
        sim.fechaInicioPago = sim.fecha_inicio_pago ?? sim.fechaInicioPago;

        // =============================================
        // COSTOS QUE SE SUMAN AL PRÉSTAMO
        // =============================================
        sim.tasacion = Number(sim.tasacion ?? sim.tasacion_min ?? 0);
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
        // IMPORTANTE: El campo en Supabase es "cargos_admin"
        // =============================================
        sim.cargosAdministrativos = Number(
            sim.cargos_admin ??           // ← Viene de Supabase
            sim.cargosAdmin ??            // ← Alternativa del repository
            sim.cargos_administrativos ?? // ← Alternativa
            sim.cargosAdministrativos ??  // ← Ya existente en memoria
            0
        );

        sim.comision = Number(
            sim.comision ??
            sim.comision_envio ??         // ← Viene de Supabase
            sim.comision_desembolso ??
            sim.comisionDesembolso ??
            0
        );

        sim.portes = Number(sim.portes ?? 0);

        // Parámetros de cálculo
        sim.diasPorAnio = 360;
        sim.frecuenciaPago = 30; // mensual
        sim.cuotasPorAnio = 12;

        console.log("=== DATOS DE ENTRADA ===");
        console.log("Valor Vivienda:", sim.valorVivienda);
        console.log("Cuota Inicial:", sim.cuotaInicial);
        console.log("Monto Bono:", sim.montoBono);
        console.log("Saldo a Financiar:", sim.saldoFinanciar);
        console.log("Tasación:", sim.tasacion);
        console.log("Gastos Notariales:", sim.gastosNotariales);
        console.log("Gastos Registrales:", sim.gastosRegistrales);
        console.log("Cargos Administrativos (raw):", sim.cargos_admin);
        console.log("Cargos Administrativos (procesado):", sim.cargosAdministrativos);
        console.log("TEA:", sim.tasaInteres + "%");
        console.log("Plazo:", sim.plazoPrestamo, "meses");
        console.log("Período Gracia:", sim.periodoGracia, "meses");
        console.log("Tipo Gracia:", sim.tipoPeriodoGracia);
    }

    /**
     * Calcular Monto del Préstamo (Monto Financiado)
     * FÓRMULA: Monto Financiado = Saldo a Financiar + Gastos Notariales + Gastos Registrales + Tasación
     */
    calcularMontoPrestamo(sim) {
        // FÓRMULA EXACTA DEL EXCEL
        sim.montoPrestamo = sim.saldoFinanciar + sim.gastosNotariales + sim.gastosRegistrales + sim.tasacion;

        // También actualizar montoFinanciado para mostrar en la UI
        sim.montoFinanciado = sim.montoPrestamo;

        console.log("=== MONTO FINANCIADO (MONTO PRÉSTAMO) ===");
        console.log("Saldo a Financiar:", sim.saldoFinanciar);
        console.log("+ Gastos Notariales:", sim.gastosNotariales);
        console.log("+ Gastos Registrales:", sim.gastosRegistrales);
        console.log("+ Tasación:", sim.tasacion);
        console.log("= MONTO FINANCIADO:", sim.montoPrestamo);
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
     * MÉTODO FRANCÉS - Cálculo del cronograma según fórmulas de Excel
     */
    calcularCuotaYCronograma(sim) {
        const montoPrestamo = sim.montoPrestamo;
        const plazo = sim.plazoPrestamo;
        const gMeses = sim.periodoGracia;
        const gTipo = sim.tipoPeriodoGracia;

        // ============================================
        // 1. FÓRMULA EXCEL: TEP (Tasa Efectiva del Período)
        // TEP = (1 + TEA)^(frecuencia / dias_por_año) - 1
        // ============================================
        const TEA = sim.tasaInteres / 100;
        const TEP = Math.pow(1 + TEA, sim.frecuenciaPago / sim.diasPorAnio) - 1;

        console.log("=== TASAS ===");
        console.log("TEA:", sim.tasaInteres + "%");
        console.log("TEP:", (TEP * 100).toFixed(5) + "%");

        // ============================================
        // 2. FÓRMULA EXCEL: Seguro de Desgravamen del Período
        // %SD_periodo = (%SD_mensual * frecuencia) / 30
        // ============================================
        const seguroDesgravamenPeriodo = (sim.seguroDesgravamenPorcentaje * sim.frecuenciaPago) / 30;

        // ============================================
        // 3. FÓRMULA EXCEL: Seguro de Riesgo por Período
        // SegRie = (%anual * valorVivienda) / cuotas_por_año
        // ============================================
        const seguroRiesgoPeriodo = (sim.seguroInmuebleAnual * sim.valorVivienda) / sim.cuotasPorAnio;

        // ============================================
        // 4. Costos periódicos fijos
        // ============================================
        const gastosAdminPeriodo = sim.cargosAdministrativos;
        const comisionPeriodo = sim.comision;
        const portesPeriodo = sim.portes;

        console.log("=== COSTOS PERIÓDICOS ===");
        console.log("Seguro Desgravamen %:", (seguroDesgravamenPeriodo * 100).toFixed(6) + "%");
        console.log("Seguro Inmueble % (anual):", (sim.seguroInmuebleAnual * 100).toFixed(6) + "%");
        console.log("Seguro Inmueble (valor raw):", sim.seguroInmuebleAnual);
        console.log("Valor Vivienda:", sim.valorVivienda);
        console.log("Cálculo: ", sim.seguroInmuebleAnual, "×", sim.valorVivienda, "÷", sim.cuotasPorAnio);
        console.log("Seguro Riesgo por período: S/", seguroRiesgoPeriodo.toFixed(2));
        console.log("Gastos Admin: S/", gastosAdminPeriodo.toFixed(2));
        console.log("Comisión: S/", comisionPeriodo.toFixed(2));
        console.log("Portes: S/", portesPeriodo.toFixed(2));

        // ============================================
        // 5. GENERAR CRONOGRAMA
        // ============================================
        const cronograma = [];
        const fechaInicio = new Date(sim.fechaInicioPago);

        // FLUJOS: Flujo 0 = +Préstamo (positivo - cliente recibe dinero)
        let flujos = [montoPrestamo];

        // Variables para totales
        let totalIntereses = 0;
        let totalAmortizacion = 0;
        let totalSeguroDesgravamen = 0;
        let totalSeguroRiesgo = 0;
        let totalGastosAdmin = 0;
        let totalComision = 0;
        let totalPortes = 0;

        // FÓRMULA EXCEL: Saldo Inicial Indexado (SII)
        // SII = SI * (1 + IP)  donde IP = 0 (sin inflación)
        let saldoInicial = montoPrestamo;

        for (let nc = 1; nc <= plazo; nc++) {
            const fechaPago = new Date(fechaInicio);
            fechaPago.setMonth(fechaPago.getMonth() + nc);

            const SII = saldoInicial;

            // FÓRMULA EXCEL 3: Interés del período
            // Interés = -SII * TEP
            const interes = SII * TEP;

            // FÓRMULA EXCEL 4: Seguro de Desgravamen
            // SegDes = -SII * %SD_periodo
            const seguroDesgravamen = SII * seguroDesgravamenPeriodo;

            let cuotaConSegDes = 0;  // Cuota incluyendo Seg Desgravamen
            let amortizacion = 0;
            let saldoFinal = 0;
            let prepago = 0; // Prepago de deuda (si aplica)
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
                    // FÓRMULA EXCEL 7: SF = SII + Amortización + Prepago
                    // En gracia total: SF = SII + Interés (se capitaliza)
                    saldoFinal = SII + interes + prepago;
                } else if (gTipo === "parcial") {
                    // GRACIA PARCIAL: Solo paga intereses (NO incluye seguro desgravamen en el pago)
                    // Según tu Excel, en gracia parcial la cuota es SOLO el interés
                    periodoGraciaLabel = 'P';
                    cuotaConSegDes = interes;  // Solo el interés, sin seguro
                    amortizacion = 0;
                    saldoFinal = SII + prepago;
                }
            } else {
                // ============================================
                // FÓRMULA EXCEL 5: Cuota método francés (cuota constante)
                // Cuota = PAGO(TEP + %SD, N - n + 1, SII, 0, 0)
                // ============================================
                periodoGraciaLabel = 'S';
                const cuotasRestantes = plazo - nc + 1;
                const tasaConSeguro = TEP + seguroDesgravamenPeriodo;

                // Función PAGO de Excel
                cuotaConSegDes = this.funcionPAGO(tasaConSeguro, cuotasRestantes, SII);

                // FÓRMULA EXCEL 6: Amortización del período
                // Amortización = Cuota - Interés - SegDes
                amortizacion = cuotaConSegDes - interes - seguroDesgravamen;

                // FÓRMULA EXCEL 7: Saldo Final del período
                // SF = SII + Amortización + Prepago
                saldoFinal = SII - amortizacion + prepago;

                if (saldoFinal < 0.01) saldoFinal = 0;
            }

            // FÓRMULA EXCEL 8: Flujo del período
            // Según tu Excel:
            // - En GRACIA (T o P): Flujo = Cuota + SegDesgrav + SegRiesgo + GasAdm
            // - SIN GRACIA (S): Flujo = Cuota + SegRiesgo + GasAdm (SIN SegDesgrav)

            let flujoNeto;
            if (nc <= gMeses) {
                // Período de GRACIA (T o P): incluye SegDesgrav
                flujoNeto = -(cuotaConSegDes + seguroDesgravamen + seguroRiesgoPeriodo + gastosAdminPeriodo);
            } else {
                // Período SIN GRACIA (S): NO incluye SegDesgrav, pero SÍ incluye GasAdm
                flujoNeto = -(cuotaConSegDes + seguroRiesgoPeriodo + gastosAdminPeriodo);
            }

            // Acumular totales
            totalIntereses += interes;
            totalAmortizacion += amortizacion;
            totalSeguroDesgravamen += seguroDesgravamen;
            totalSeguroRiesgo += seguroRiesgoPeriodo;
            totalGastosAdmin += gastosAdminPeriodo;
            totalComision += comisionPeriodo;
            totalPortes += portesPeriodo;

            // Agregar al cronograma
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
                prepago: this.redondear2(prepago),
                saldoFinal: this.redondear2(saldoFinal),
                flujo: this.redondear2(flujoNeto),

                // Campos adicionales para compatibilidad
                // cuotaBase: es la cuota sin incluir otros costos periódicos
                cuotaBase: this.redondear2(cuotaConSegDes),
                // cuotaTotal: según tu Excel, es la misma que cuotaConSegDes
                // Los otros costos (SegRiesgo, GasAdm) NO se suman a la cuota, van por separado
                cuotaTotal: this.redondear2(cuotaConSegDes),
                seguros: this.redondear2(seguroDesgravamen + seguroRiesgoPeriodo),
                enPeriodoGracia: nc <= gMeses,
                tipoPeriodoGracia: nc <= gMeses ? gTipo : null
            });

            // Agregar flujo (negativo)
            flujos.push(flujoNeto);

            // FÓRMULA EXCEL 2: Actualizar saldo para siguiente período
            // SII = SI * (1 + IP)
            saldoInicial = saldoFinal;
        }

        // Guardar resultados
        sim.cronogramaPagos = cronograma;
        sim.totalIntereses = this.redondear2(totalIntereses);
        sim.totalAmortizacion = this.redondear2(totalAmortizacion);
        sim.totalSeguroDesgravamen = this.redondear2(totalSeguroDesgravamen);
        sim.totalSeguroRiesgo = this.redondear2(totalSeguroRiesgo);
        sim.totalGastosAdmin = this.redondear2(totalGastosAdmin);
        sim.totalComision = this.redondear2(totalComision);
        sim.totalPortes = this.redondear2(totalPortes);
        sim.flujos = flujos;

        // Cuota mensual (primera cuota normal)
        const cuotasNormales = cronograma.filter(c => !c.enPeriodoGracia);
        sim.cuotaMensual = cuotasNormales.length > 0
            ? this.redondear2(cuotasNormales[0].cuotaTotal)
            : 0;

        console.log("=== CUOTA MENSUAL ===");
        console.log("Cuotas normales encontradas:", cuotasNormales.length);
        console.log("Primera cuota normal:", cuotasNormales[0]?.cuotaTotal);
        console.log("Cuota mensual asignada:", sim.cuotaMensual);

        // Guardar TEP calculado
        sim.TEP = TEP;
        sim.seguroRiesgoPeriodo = seguroRiesgoPeriodo;

        console.log("=== CUOTAS ===");
        console.log("Cuota Gracia (1-3):", cronograma[0]?.cuotaConSegDes);
        console.log("Cuota Normal (4+):", cronograma[3]?.cuotaConSegDes);
        console.log("Flujo Gracia:", cronograma[0]?.flujo);
        console.log("Flujo Normal:", cronograma[3]?.flujo);
        console.log("=== FLUJOS PARA TIR/VAN ===");
        console.log("Número de flujos:", flujos.length);
        console.log("Primeros 5 flujos:", flujos.slice(0, 5));
        console.log("Suma de flujos (debe ser cercana a 0):", flujos.reduce((a, b) => a + b, 0));
    }

    /**
     * FÓRMULA EXCEL: Función PAGO (PMT)
     * Calcula el pago periódico de un préstamo con tasa constante
     * PAGO(tasa, nper, va, vf, tipo)
     */
    funcionPAGO(tasa, nper, va, vf = 0, tipo = 0) {
        if (tasa === 0) {
            return -(va + vf) / nper;
        }

        const pvif = Math.pow(1 + tasa, nper);
        let pago = (tasa * (va * pvif + vf)) / (pvif - 1);

        if (tipo === 1) {
            pago /= (1 + tasa);
        }

        return pago;
    }

    /**
     * CÁLCULO DE INDICADORES FINANCIEROS
     */
    calcularIndicadoresFinancieros(sim) {
        const flujos = sim.flujos;

        console.log("=== INDICADORES ===");
        console.log("COK:", sim.tasaDescuentoCOK + "%");

        // ============================================
        // Tasa de descuento del período
        // TDP = (1 + COK)^(30/360) - 1
        // ============================================
        const COK = sim.tasaDescuentoCOK / 100;
        const TDP = Math.pow(1 + COK, sim.frecuenciaPago / sim.diasPorAnio) - 1;

        sim.tasaDescuentoPeriodo = TDP;
        console.log("TDP:", (TDP * 100).toFixed(5) + "%");

        // ============================================
        // FÓRMULA EXCEL 9: TIR del período
        // TIR = TIR(Flujos)
        // ============================================
        const tirPeriodo = this.calcularTIR(flujos);
        sim.tir = this.redondear5(tirPeriodo * 100);
        console.log("TIR:", sim.tir + "%");

        // ============================================
        // FÓRMULA EXCEL 10: TCEA
        // TCEA = (1 + TIR)^(cuotas_por_año) - 1
        // ============================================
        const tcea = Math.pow(1 + tirPeriodo, sim.cuotasPorAnio) - 1;
        sim.tcea = this.redondear4(tcea * 100);
        console.log("TCEA:", sim.tcea + "%");

        // ============================================
        // FÓRMULA EXCEL 11: VAN (Valor Actual Neto)
        // VAN = Flujo_0 + VNA(tasa_descuento_per, Flujos)
        // ============================================
        let van = flujos[0]; // Flujo inicial (positivo)
        for (let i = 1; i < flujos.length; i++) {
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