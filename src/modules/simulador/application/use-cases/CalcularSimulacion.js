// src/modules/simulador/application/use-cases/CalcularSimulacion.js

import { Simulacion } from '../../domain/entities/Simulacion.js';

export class CalcularSimulacion {
    constructor(repository) {
        this.repository = repository;
    }

    async execute(simData) {
        try {
            // 🔄 1. CREATE ENTITY
            const simulacion = Simulacion.create(simData);
            const validation = simulacion.validate();
            if (!validation.valid) throw new Error(validation.errors.join(', '));

            // 🔄 2. Monto a financiar
            simulacion.calculateMontoFinanciado();

            // 🔄 3. Cuota + cronograma
            this.calcularCuotaYCronograma(simulacion);

            // 🔄 4. TCEA, VAN, TIR
            this.calcularIndicadoresFinancieros(simulacion);

            // 🔄 5. Adaptar nombres a lo que Supabase espera
            this.mapearCamposParaRepository(simulacion);

            return simulacion;

        } catch (error) {
            console.error("Error en CalcularSimulacion:", error);
            throw error;
        }
    }

    /**
     * ADAPTACIÓN DE CAMPOS → los nombres nuevos que exige el repositorio
     */
    mapearCamposParaRepository(sim) {

        sim.programa = sim.programa_objetivo;
        sim.valor_vivienda = sim.valor_vivienda;
        sim.bono_monto = sim.monto_bono;

        sim.cuota_inicial_monto = sim.cuota_inicial;
        sim.cuota_inicial_porcentaje = sim.cuota_inicial_porcentaje;

        sim.saldo_financiar = sim.monto_financiado;

        sim.tasa_valor = sim.tasa_interes;
        sim.tasa_descuento = sim.tasa_descuento;

        sim.plazo_tipo = "meses";
        sim.plazo_valor = sim.plazo_prestamo;

        sim.gracia_tipo = sim.tipo_periodo_gracia;
        sim.gracia_meses = sim.periodo_gracia;

// costos
        sim.seguro_desgravamen = sim.seguroDesgravamen;
        sim.seguro_inmueble = sim.seguroInmueble;

        sim.tasacion = sim.tasacion;
        sim.gastos_notariales = sim.gastosNotariales;
        sim.gastos_registrales = sim.gastosRegistrales;
        sim.cargos_administrativos = sim.cargosAdministrativos;

        sim.comision_desembolso = sim.comisionDesembolso;
        sim.cuota = sim.cuotaMensual;
    }

    /**
     * Calcular cuota y cronograma
     */
    calcularCuotaYCronograma(sim) {

        const montoFinanciado = sim.montoFinanciado;
        const tasaMensual = this.convertirTEAaTEM(sim.tasaInteres);
        const plazoMeses = sim.plazoPrestamo;

        const periodoGracia = sim.periodoGracia || 0;
        const tipoGracia = sim.tipoPeriodoGracia || "ninguno";

        let montoAFinanciar = montoFinanciado;

        if (tipoGracia === "parcial" && periodoGracia > 0) {
            montoAFinanciar = montoFinanciado * Math.pow(1 + tasaMensual, periodoGracia);
        }

        const mesesAmortizacion = plazoMeses - periodoGracia;

        const cuotaBase = montoAFinanciar *
            (tasaMensual * Math.pow(1 + tasaMensual, mesesAmortizacion)) /
            (Math.pow(1 + tasaMensual, mesesAmortizacion) - 1);

        const costoMensual = this.calcularCostosAdicionalesMensuales(sim);

        sim.cuotaMensual = Math.round((cuotaBase + costoMensual) * 100) / 100;

        sim.cronogramaPagos = this.generarCronogramaPagos(
            sim,
            montoFinanciado,
            tasaMensual,
            cuotaBase,
            costoMensual,
            montoAFinanciar
        );

        sim.totalIntereses = sim.cronogramaPagos.reduce(
            (total, p) => total + p.interes, 0
        );
    }

    convertirTEAaTEM(tea) {
        return Math.pow(1 + tea / 100, 1 / 12) - 1;
    }

    calcularCostosAdicionalesMensuales(sim) {
        let total = 0;

        if (sim.seguroDesgravamen > 0)
            total += sim.seguroDesgravamen;

        if (sim.seguroInmueble > 0)
            total += sim.seguroInmueble;

        return total;
    }

    generarCronogramaPagos(sim, saldoInicial, tasaMensual, cuotaBase, costos, montoAjustado) {
        const cronograma = [];
        const fechaInicio = new Date(sim.fechaInicioPago);

        const periodoGracia = sim.periodoGracia || 0;
        const tipoGracia = sim.tipoPeriodoGracia;

        for (let i = 1; i <= sim.plazoPrestamo; i++) {

            const fechaPago = new Date(fechaInicio);
            fechaPago.setMonth(fechaPago.getMonth() + i);

            let interes = saldoInicial * tasaMensual;
            let amortizacion = 0;
            let cuota = 0;
            let seguros = 0;

            if (i <= periodoGracia) {
                if (tipoGracia === "total") {
                    cuota = interes;
                    seguros = costos;
                } else if (tipoGracia === "parcial") {
                    saldoInicial *= (1 + tasaMensual);
                }
            } else {
                if (i === periodoGracia + 1 && tipoGracia === "parcial") {
                    saldoInicial = montoAjustado;
                    interes = saldoInicial * tasaMensual;
                }

                cuota = cuotaBase;
                amortizacion = cuotaBase - interes;
                seguros = costos;
            }

            const cuotaTotal = cuota + seguros;
            const saldoFinal = saldoInicial - amortizacion;

            cronograma.push({
                numeroCuota: i,
                fechaPago: fechaPago.toISOString().split("T")[0],
                saldoInicial: Number(saldoInicial.toFixed(2)),
                cuotaBase: Number(cuota.toFixed(2)),
                interes: Number(interes.toFixed(2)),
                amortizacion: Number(amortizacion.toFixed(2)),
                seguros: Number(seguros.toFixed(2)),
                cuotaTotal: Number(cuotaTotal.toFixed(2)),
                saldoFinal: Number(saldoFinal.toFixed(2)),
                enPeriodoGracia: i <= periodoGracia,
                tipoPeriodoGracia: i <= periodoGracia ? tipoGracia : null
            });

            saldoInicial = saldoFinal;
        }

        return cronograma;
    }

    calcularIndicadoresFinancieros(sim) {

        const costosIniciales =
            sim.tasacion + sim.gastosNotariales + sim.comisionDesembolso;

        const totalCuotas = sim.cronogramaPagos.reduce(
            (sum, p) => sum + p.cuotaTotal,
            0
        );

        const costoTotal = totalCuotas + costosIniciales + sim.cuotaInicial;

        const tcea = (costoTotal / sim.valorVivienda - 1) * 100;

        sim.tcea = Number(tcea.toFixed(2));

        // VAN (10%)
        const r = 0.10 / 12;
        let van = -sim.montoFinanciado;

        sim.cronogramaPagos.forEach((pago, idx) => {
            van += pago.cuotaTotal / Math.pow(1 + r, idx + 1);
        });

        sim.van = Number(van.toFixed(2));

        sim.tir = Number((this.convertirTEAaTEM(sim.tasaInteres) * 12 * 100).toFixed(2));
    }

}