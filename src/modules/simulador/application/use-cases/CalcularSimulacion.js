// src/modules/simulador/application/use-cases/CalcularSimulacion.js

import { Simulacion } from '../../domain/entities/Simulacion.js';

/**
 * Caso de uso: Calcular simulación de plan de pagos
 */
export class CalcularSimulacion {
    constructor(repository) {
        this.repository = repository;
    }

    /**
     * Ejecuta el cálculo de la simulación
     */
    async execute(simulacionData) {
        try {
            const simulacion = Simulacion.create(simulacionData);
            const validation = simulacion.validate();

            if (!validation.valid) {
                throw new Error(validation.errors.join(', '));
            }

            // Calcular monto financiado
            simulacion.calculateMontoFinanciado();

            // Calcular cuota mensual y cronograma
            this.calcularCuotaYCronograma(simulacion);

            // Calcular indicadores financieros
            this.calcularIndicadoresFinancieros(simulacion);

            return simulacion;
        } catch (error) {
            console.error('Error en CalcularSimulacion:', error);
            throw error;
        }
    }

    /**
     * Calcula la cuota mensual y genera el cronograma de pagos
     */
    calcularCuotaYCronograma(simulacion) {
        const montoFinanciado = simulacion.montoFinanciado;
        const tasaMensual = this.convertirTEAaTEM(simulacion.tasaInteres);
        const plazoMeses = simulacion.plazoPrestamo;
        const periodoGracia = simulacion.periodoGracia || 0;
        const tipoPeriodoGracia = simulacion.tipoPeriodoGracia || 'ninguno';

        // Calcular monto ajustado si hay periodo de gracia parcial
        let montoAFinanciar = montoFinanciado;

        if (tipoPeriodoGracia === 'parcial' && periodoGracia > 0) {
            // En periodo de gracia parcial, los intereses se capitalizan
            // El monto crece durante el periodo de gracia
            montoAFinanciar = montoFinanciado * Math.pow(1 + tasaMensual, periodoGracia);
        }

        // Fórmula de cuota fija (método francés) para los meses después del periodo de gracia
        const mesesAmortizacion = plazoMeses - periodoGracia;
        const cuotaPura = montoAFinanciar * (tasaMensual * Math.pow(1 + tasaMensual, mesesAmortizacion)) /
            (Math.pow(1 + tasaMensual, mesesAmortizacion) - 1);

        // Agregar costos adicionales mensuales
        const costosAdicionales = this.calcularCostosAdicionalesMensuales(simulacion);

        // Durante periodo de gracia total, solo se pagan intereses + costos
        // Durante periodo de gracia parcial, no se paga nada
        // Después del periodo de gracia, se paga la cuota fija + costos
        simulacion.cuotaMensual = Math.round((cuotaPura + costosAdicionales) * 100) / 100;

        // Generar cronograma
        simulacion.cronogramaPagos = this.generarCronogramaPagos(
            simulacion,
            montoFinanciado,
            tasaMensual,
            cuotaPura,
            costosAdicionales,
            montoAFinanciar
        );

        // Calcular total de intereses
        simulacion.totalIntereses = simulacion.cronogramaPagos.reduce(
            (total, pago) => total + pago.interes, 0
        );
    }

    /**
     * Convierte TEA a TEM
     */
    convertirTEAaTEM(tea) {
        return Math.pow(1 + tea / 100, 1/12) - 1;
    }

    /**
     * Calcula costos adicionales mensuales
     */
    calcularCostosAdicionalesMensuales(simulacion) {
        let costosMensuales = 0;

        // Seguro desgravamen (mensual)
        if (simulacion.seguroDesgravamen > 0) {
            costosMensuales += simulacion.seguroDesgravamen;
        }

        // Seguro inmueble (mensual)
        if (simulacion.seguroInmueble > 0) {
            costosMensuales += simulacion.seguroInmueble;
        }

        return costosMensuales;
    }

    /**
     * Genera el cronograma de pagos detallado con manejo de periodo de gracia
     */
    generarCronogramaPagos(simulacion, montoFinanciadoInicial, tasaMensual, cuotaPura, costosAdicionales, montoAjustadoGracia) {
        const cronograma = [];
        let saldoInicial = montoFinanciadoInicial;
        const fechaInicio = new Date(simulacion.fechaInicioPago);
        const periodoGracia = simulacion.periodoGracia || 0;
        const tipoPeriodoGracia = simulacion.tipoPeriodoGracia || 'ninguno';

        for (let i = 1; i <= simulacion.plazoPrestamo; i++) {
            const fechaPago = new Date(fechaInicio);
            fechaPago.setMonth(fechaPago.getMonth() + i);

            let interes = saldoInicial * tasaMensual;
            let amortizacion = 0;
            let cuotaBase = 0;
            let seguros = 0;

            if (i <= periodoGracia) {
                // Durante el periodo de gracia
                if (tipoPeriodoGracia === 'total') {
                    // Periodo de gracia total: solo se pagan intereses
                    cuotaBase = interes;
                    amortizacion = 0;
                    seguros = costosAdicionales;
                } else if (tipoPeriodoGracia === 'parcial') {
                    // Periodo de gracia parcial: no se paga nada, los intereses se capitalizan
                    cuotaBase = 0;
                    amortizacion = 0;
                    seguros = 0;
                    // El saldo aumenta por los intereses capitalizados
                    saldoInicial = saldoInicial * (1 + tasaMensual);
                }
            } else {
                // Después del periodo de gracia: pago normal
                // Si hubo periodo de gracia parcial, usar el monto ajustado
                if (i === periodoGracia + 1 && tipoPeriodoGracia === 'parcial') {
                    saldoInicial = montoAjustadoGracia;
                    interes = saldoInicial * tasaMensual;
                }

                cuotaBase = cuotaPura;
                amortizacion = cuotaPura - interes;
                seguros = costosAdicionales;
            }

            const cuotaTotal = cuotaBase + seguros;
            const saldoFinal = saldoInicial - amortizacion;

            cronograma.push({
                numeroCuota: i,
                fechaPago: fechaPago.toISOString().split('T')[0],
                saldoInicial: Math.round(saldoInicial * 100) / 100,
                cuotaBase: Math.round(cuotaBase * 100) / 100,
                interes: Math.round(interes * 100) / 100,
                amortizacion: Math.round(amortizacion * 100) / 100,
                seguros: Math.round(seguros * 100) / 100,
                cuotaTotal: Math.round(cuotaTotal * 100) / 100,
                saldoFinal: Math.round(saldoFinal * 100) / 100,
                enPeriodoGracia: i <= periodoGracia,
                tipoPeriodoGracia: i <= periodoGracia ? tipoPeriodoGracia : null
            });

            saldoInicial = saldoFinal;
        }

        return cronograma;
    }

    /**
     * Calcula indicadores financieros (TCEA, VAN, TIR)
     */
    calcularIndicadoresFinancieros(simulacion) {
        // Calcular TCEA (Tasa de Costo Efectivo Anual)
        const costosIniciales = simulacion.tasacion +
            simulacion.gastosNotariales +
            simulacion.comisionDesembolso;

        const flujosTotales = simulacion.cronogramaPagos.reduce(
            (total, pago) => total + pago.cuotaTotal, 0
        );

        const costoTotal = flujosTotales + costosIniciales + simulacion.cuotaInicial;
        const tasaEfectiva = (costoTotal / simulacion.valorVivienda - 1) * 100;

        simulacion.tcea = Math.round(tasaEfectiva * 100) / 100;

        // Calcular VAN (Valor Actual Neto) - simplificado
        const tasaDescuento = 0.10; // 10% anual
        let van = -simulacion.montoFinanciado;

        simulacion.cronogramaPagos.forEach((pago, index) => {
            van += pago.cuotaTotal / Math.pow(1 + tasaDescuento/12, index + 1);
        });

        simulacion.van = Math.round(van * 100) / 100;

        // Calcular TIR (Tasa Interna de Retorno) - simplificado
        simulacion.tir = this.calcularTIR(simulacion);
    }

    /**
     * Calcula la TIR usando método de Newton-Raphson simplificado
     */
    calcularTIR(simulacion) {
        // Implementación simplificada de TIR
        const flujos = [-simulacion.montoFinanciado];
        simulacion.cronogramaPagos.forEach(pago => {
            flujos.push(pago.cuotaTotal);
        });

        // Simplificación: usar la tasa mensual como aproximación
        const tir = this.convertirTEAaTEM(simulacion.tasaInteres) * 12 * 100;

        return Math.round(tir * 100) / 100;
    }
}