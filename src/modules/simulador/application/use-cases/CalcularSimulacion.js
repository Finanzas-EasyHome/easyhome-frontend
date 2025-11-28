// src/modules/simulador/application/use-cases/CalcularSimulacion.js

import { Simulacion } from '/src/modules/simulador/domain/entities/Simulacion.js';

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

            // 3️⃣ Calcular monto financiado
            simulacion.calculateMontoFinanciado();

            // 4️⃣ Sincronizar ENTRADA para cálculos (camelCase)
            this.sincronizarEntrada(simulacion);

            // 5️⃣ Calcular cuota y cronograma (método francés)
            this.calcularCuotaYCronograma(simulacion);

            // 6️⃣ Calcular indicadores financieros
            this.calcularIndicadoresFinancieros(simulacion);

            // 7️⃣ Sincronizar SALIDA (camelCase → snake_case)
            this.sincronizarSalida(simulacion);

            return simulacion;

        } catch (error) {
            console.error("Error en CalcularSimulacion:", error);
            throw error;
        }
    }

    /**
     * Convertir campos snake_case → camelCase para cálculo interno
     */
    sincronizarEntrada(sim) {
        sim.valorVivienda = Number(sim.valor_vivienda ?? sim.valorVivienda ?? 0);
        sim.cuotaInicial = Number(sim.cuota_inicial ?? sim.cuotaInicial ?? 0);
        sim.cuotaInicialPorcentaje = Number(sim.cuota_inicial_porcentaje ?? sim.cuotaInicialPorcentaje ?? 0);
        sim.montoBono = Number(sim.monto_bono ?? sim.montoBono ?? 0);
        sim.montoFinanciado = Number(sim.monto_financiado ?? sim.montoFinanciado ?? 0);

        sim.tasaInteres = Number(sim.tasa_interes ?? sim.tasaInteres ?? 0);
        sim.plazoPrestamo = Number(sim.plazo_prestamo ?? sim.plazoPrestamo ?? 0);

        sim.periodoGracia = Number(sim.periodo_gracia ?? sim.periodoGracia ?? 0);
        sim.tipoPeriodoGracia = sim.tipo_periodo_gracia ?? sim.tipoPeriodoGracia ?? 'ninguno';

        sim.fechaInicioPago = sim.fecha_inicio_pago ?? sim.fechaInicioPago;

        sim.seguroDesgravamen = Number(sim.seguro_desgravamen ?? sim.seguroDesgravamen ?? 0);
        sim.seguroInmueble = Number(sim.seguro_inmueble ?? sim.seguroInmueble ?? 0);
        sim.tasacion = Number(sim.tasacion ?? sim.tasacion ?? 0);
        sim.gastosNotariales = Number(sim.gastos_notariales ?? sim.gastosNotariales ?? 0);
        sim.gastosRegistrales = Number(sim.gastos_registrales ?? sim.gastosRegistrales ?? 0);
        sim.cargosAdministrativos = Number(sim.cargos_administrativos ?? sim.cargosAdministrativos ?? 0);
        sim.comisionDesembolso = Number(sim.comision_desembolso ?? sim.comisionDesembolso ?? 0);
    }

    /**
     * Sincronizar resultados camelCase → snake_case
     */
    sincronizarSalida(sim) {
        sim.cuota_mensual = sim.cuotaMensual;
        sim.total_intereses = sim.totalIntereses;
        sim.cronograma_pagos = sim.cronogramaPagos;

        // TCEA, VAN, TIR ya en camelCase pero se usan así
    }

    /**
     * Cálculo método francés + manejo de gracia
     */
    calcularCuotaYCronograma(sim) {

        const monto = sim.montoFinanciado;
        const tasaMensual = this.convertirTEAaTEM(sim.tasaInteres);
        const plazo = sim.plazoPrestamo;

        const gMeses = sim.periodoGracia;
        const gTipo = sim.tipoPeriodoGracia;

        // Ajuste por gracia parcial (capitalizando intereses)
        let saldo = monto;
        let saldoAjustado = monto;

        if (gTipo === "parcial" && gMeses > 0) {
            saldoAjustado = monto * Math.pow(1 + tasaMensual, gMeses);
        }

        const nAmortizacion = plazo - gMeses;

        // Cuota base método francés
        const cuotaBase =
            saldoAjustado *
            (tasaMensual * Math.pow(1 + tasaMensual, nAmortizacion)) /
            (Math.pow(1 + tasaMensual, nAmortizacion) - 1);

        const costosMensuales = this.calcularCostosAdicionalesMensuales(sim);

        sim.cuotaMensual = this.redondear2(cuotaBase + costosMensuales);

        // Generar cronograma
        sim.cronogramaPagos = this.generarCronogramaPagos(
            sim,
            monto,
            tasaMensual,
            cuotaBase,
            costosMensuales,
            saldoAjustado
        );

        // Total intereses
        sim.totalIntereses = sim.cronogramaPagos.reduce(
            (acc, p) => acc + p.interes, 0
        );
    }

    /**
     * Convierte TEA % → TEM mensual
     */
    convertirTEAaTEM(tea) {
        return Math.pow(1 + tea / 100, 1 / 12) - 1;
    }

    calcularCostosAdicionalesMensuales(sim) {
        return (sim.seguroDesgravamen ?? 0) + (sim.seguroInmueble ?? 0);
    }

    generarCronogramaPagos(sim, saldoInicial, tasaMensual, cuotaBase, costos, saldoParcial) {

        const cronograma = [];
        const fechaInicio = new Date(sim.fechaInicioPago);

        const gMeses = sim.periodoGracia;
        const gTipo = sim.tipoPeriodoGracia;

        for (let i = 1; i <= sim.plazoPrestamo; i++) {

            const fechaPago = new Date(fechaInicio);
            fechaPago.setMonth(fechaPago.getMonth() + i);

            let interes = saldoInicial * tasaMensual;
            let amort = 0;
            let cuota = 0;
            let seguros = costos;

            if (i <= gMeses) {
                if (gTipo === "total") {
                    cuota = interes;
                    amort = 0;
                }
                else if (gTipo === "parcial") {
                    saldoInicial *= (1 + tasaMensual);
                    interes = saldoInicial * tasaMensual;
                    cuota = 0;
                    amort = 0;
                }
            } else {
                if (i === gMeses + 1 && gTipo === "parcial") {
                    saldoInicial = saldoParcial;
                    interes = saldoInicial * tasaMensual;
                }
                cuota = cuotaBase;
                amort = cuotaBase - interes;
            }

            const cuotaTotal = cuota + seguros;
            const saldoFinal = saldoInicial - amort;

            cronograma.push({
                numeroCuota: i,
                fechaPago: fechaPago.toISOString().split("T")[0],
                saldoInicial: this.redondear2(saldoInicial),
                cuotaBase: this.redondear2(cuota),
                interes: this.redondear2(interes),
                amortizacion: this.redondear2(amort),
                seguros: this.redondear2(seguros),
                cuotaTotal: this.redondear2(cuotaTotal),
                saldoFinal: this.redondear2(saldoFinal),
                enPeriodoGracia: i <= gMeses,
                tipoPeriodoGracia: i <= gMeses ? gTipo : null
            });

            saldoInicial = saldoFinal;
        }

        return cronograma;
    }

    /**
     * TCEA / VAN / TIR
     */
    calcularIndicadoresFinancieros(sim) {

        const costosIniciales =
            (sim.tasacion ?? 0) +
            (sim.gastosNotariales ?? 0) +
            (sim.comisionDesembolso ?? 0);

        const totalCuotas = sim.cronogramaPagos.reduce(
            (sum, p) => sum + p.cuotaTotal,
            0
        );

        const costoTotal = totalCuotas + costosIniciales + sim.cuotaInicial;

        sim.tcea = Number(((costoTotal / sim.valorVivienda - 1) * 100).toFixed(2));

        // VAN con tasa 10% anual
        const r = 0.10 / 12;
        let van = -sim.montoFinanciado;

        sim.cronogramaPagos.forEach((pago, idx) => {
            van += pago.cuotaTotal / Math.pow(1 + r, idx + 1);
        });

        sim.van = Number(van.toFixed(2));

        // TIR aproximada
        sim.tir = Number((this.convertirTEAaTEM(sim.tasaInteres) * 12 * 100).toFixed(2));
    }

    redondear2(v) {
        return Math.round(v * 100) / 100;
    }
}
