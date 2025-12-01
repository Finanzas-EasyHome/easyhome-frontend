// src/modules/simulador/presentation/composables/useSimulador.js

import { ref, computed } from 'vue';
import { SimuladorRepositoryImpl } from '/src/modules/simulador/infrastructure/repositories/SimuladorRepositoryImpl.js';
import { CalcularSimulacion } from '/src/modules/simulador/application/use-cases/CalcularSimulacion.js';
import { GuardarSimulacion } from '/src/modules/simulador/application/use-cases/GuardarSimulacion.js';
import { Simulacion } from '/src/modules/simulador/domain/entities/Simulacion.js';

/**
 * Composable para manejar la lógica del simulador
 */
export const useSimulador = () => {
    // State
    const simulacionActual = ref(null);
    const historialSimulaciones = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const entidadesFinancieras = ref([]);
    const programasVivienda = ref([]);

    // Repository & Use Cases
    const repository = new SimuladorRepositoryImpl();
    const calcularSimulacion = new CalcularSimulacion(repository);
    const guardarSimulacion = new GuardarSimulacion(repository);

    // Computed
    const tieneSimulacion = computed(() => simulacionActual.value !== null);
    const tieneCronograma = computed(() =>
        simulacionActual.value?.cronogramaPagos?.length > 0
    );

    // Methods

    /**
     * Calcula una nueva simulación
     */
    const calcular = async (datosSimulacion) => {
        loading.value = true;
        error.value = null;
        try {
            // Crear instancia de la clase Simulacion
            const resultado = await calcularSimulacion.execute(datosSimulacion);
            // Guardar
            simulacionActual.value = resultado;

            return resultado;
        } catch (e) {
            error.value = e.message || 'Error al calcular la simulación';
            console.error('Error en calcular:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Guarda la simulación actual en el historial
     */
    const guardar = async () => {
        console.log("SIMULACIÓN LISTA PARA GUARDAR:", simulacionActual.value);
        console.log("ENTIDAD FINANCIERA:", simulacionActual.value?.entidad_financiera);
        if (!simulacionActual.value) {
            throw new Error('No hay simulación para guardar');
        }

        loading.value = true;
        error.value = null;
        try {
            const simulacionGuardada = await guardarSimulacion.execute(simulacionActual.value);
            historialSimulaciones.value.unshift(simulacionGuardada);
            return simulacionGuardada;
        } catch (e) {
            error.value = e.message || 'Error al guardar la simulación';
            console.error('Error en guardar:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Obtiene el historial de simulaciones
     */
    const fetchHistorial = async () => {
        loading.value = true;
        error.value = null;
        try {
            const simulaciones = await repository.findAll();
            historialSimulaciones.value = simulaciones;
            return simulaciones;
        } catch (e) {
            error.value = e.message || 'Error al cargar el historial';
            console.error('Error en fetchHistorial:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Carga una simulación del historial
     */
    const cargarSimulacion = async (id) => {
        loading.value = true;
        error.value = null;
        try {
            const simulacion = await repository.findById(id);
            simulacionActual.value = simulacion;
            return simulacion;
        } catch (e) {
            error.value = e.message || 'Error al cargar la simulación';
            console.error('Error en cargarSimulacion:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Elimina una simulación del historial
     */
    const eliminarSimulacion = async (id) => {
        loading.value = true;
        error.value = null;
        try {
            await repository.delete(id);
            historialSimulaciones.value = historialSimulaciones.value.filter(
                sim => sim.id !== id
            );
        } catch (e) {
            error.value = e.message || 'Error al eliminar la simulación';
            console.error('Error en eliminarSimulacion:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Limpia la simulación actual
     */
    const limpiarSimulacion = () => {
        simulacionActual.value = null;
        error.value = null;
    };

    /**
     * Obtiene las entidades financieras
     */
    const fetchEntidadesFinancieras = async () => {
        try {
            const entidades = await repository.getEntidadesFinancieras();
            entidadesFinancieras.value = entidades;
            return entidades;
        } catch (e) {
            console.error('Error al obtener entidades financieras:', e);
            return [];
        }
    };

    /**
     * Obtiene los programas de vivienda
     */
    const fetchProgramasVivienda = async () => {
        try {
            const programas = await repository.getProgramasVivienda();
            programasVivienda.value = programas;
            return programas;
        } catch (e) {
            console.error('Error al obtener programas de vivienda:', e);
            return [];
        }
    };

    /**
     * 🔥 NUEVA FUNCIÓN UNIFICADA: Obtiene cliente con vivienda según programa
     */
    const fetchClienteConVivienda = async (clienteId, programa) => {
        loading.value = true;
        error.value = null;

        try {
            const esNCMV = programa === 'miVivienda' ||
                programa === 'miViviendaVerde' ||
                programa === 'convencional';

            console.log(`🔍 Obteniendo cliente ${clienteId} del programa ${programa} (NCMV: ${esNCMV})`);

            const data = esNCMV
                ? await repository.getClienteConViviendaNCMV(clienteId)
                : await repository.getClienteConVivienda(clienteId);

            console.log('✅ Datos del cliente obtenidos:', data);
            return data;
        } catch (e) {
            console.error("❌ Error al obtener cliente:", e);
            error.value = "No se pudo cargar la información del cliente";
            throw e;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Obtiene las tasas TEA de una entidad según el programa
     */
    const fetchTasasEntidad = async (entidadValue, programa = 'miVivienda') => {
        try {
            const tasas = await repository.getTasasEntidad(entidadValue, programa);
            return tasas;
        } catch (e) {
            console.error('Error al obtener tasas de entidad:', e);
            return { min: 0, max: 0, promedio: 0 };
        }
    };

    /**
     * 🏠 FUNCIÓN MEJORADA: Obtiene el bono de Techo Propio
     * Valida que ambos parámetros existan antes de consultar
     */
    const fetchBonoTechoPropio = async (modalidad, tipoVis) => {
        try {
            // ⚠️ VALIDACIÓN: Verificar que ambos campos existan
            if (!modalidad || modalidad.trim() === '') {
                console.warn('⚠️ fetchBonoTechoPropio: modalidad_vivienda está vacía');
                return 0;
            }

            if (!tipoVis || tipoVis.trim() === '') {
                console.warn('⚠️ fetchBonoTechoPropio: tipo_vis está vacío');
                return 0;
            }

            console.log(`🔍 Consultando bono Techo Propio: "${modalidad}" + "${tipoVis}"`);

            const bono = await repository.getBonoTechoPropio(modalidad, tipoVis);
            const montoFinal = Number(bono ?? 0);

            if (montoFinal > 0) {
                console.log(`💰 Bono encontrado: S/ ${montoFinal.toFixed(2)}`);
            } else {
                console.log(`⚠️ No existe bono para: ${modalidad} - ${tipoVis}`);
            }

            return montoFinal;
        } catch (error) {
            console.error("❌ Error obteniendo bono Techo Propio:", error);
            return 0;
        }
    };

    /**
     * 🆕 NUEVA FUNCIÓN: Calcula bono BBP para NCMV
     */
    const fetchBonoBBP = async (valorVivienda, tipoBBP) => {
        try {
            // Determinar rango según valor de vivienda
            let rango = '';
            if (valorVivienda >= 68800 && valorVivienda <= 98100) rango = 'R1';
            else if (valorVivienda > 98100 && valorVivienda <= 146900) rango = 'R2';
            else if (valorVivienda > 146900 && valorVivienda <= 244600) rango = 'R3';
            else if (valorVivienda > 244600 && valorVivienda <= 362100) rango = 'R4';
            else if (valorVivienda > 362100 && valorVivienda <= 488800) rango = 'R5';
            else {
                console.log('⚠️ Valor de vivienda fuera de rangos BBP:', valorVivienda);
                return 0;
            }

            if (!tipoBBP || tipoBBP === 'No aplica') {
                console.log('⚠️ Cliente sin BBP');
                return 0;
            }

            console.log(`🔍 Consultando BBP: Rango ${rango}, Tipo ${tipoBBP}`);

            const data = await repository.getBonoBBP(rango, tipoBBP);
            const montoFinal = Number(data?.monto ?? 0);

            if (montoFinal > 0) {
                console.log(`💰 Bono BBP encontrado: S/ ${montoFinal.toFixed(2)}`);
            } else {
                console.log(`⚠️ No existe bono BBP para: ${rango} - ${tipoBBP}`);
            }

            return montoFinal;
        } catch (error) {
            console.error("❌ Error obteniendo bono BBP:", error);
            return 0;
        }
    };

    const exportarCronograma = (fileName = 'cronograma_pagos.xls') => {
        const cronograma = simulacionActual.value?.cronogramaPagos;

        if (!Array.isArray(cronograma) || cronograma.length === 0) {
            throw new Error('No hay cronograma para exportar');
        }

        const formatCurrency = (valor) => {
            const numero = Number.parseFloat(valor ?? 0);
            const seguro = Number.isFinite(numero) ? numero : 0;
            return `S/ ${seguro.toFixed(2)}`;
        };

        const headerRow = [
            'N° Cuota',
            'Fecha de Pago',
            'Saldo Inicial',
            'Cuota Base (inc. Seg. Des)',
            'Interés',
            'Amortización',
            'Seg. Desgravamen',
            'Seg. Riesgo',
            'Comisión',
            'Portes',
            'Gastos Adm.',
            'Cuota Total',
            'Saldo Final',
            'Flujo'
        ];

        const rows = cronograma.map(pago => [
            pago.numeroCuota ?? '',
            pago.fechaPago ?? '',
            formatCurrency(pago.saldoInicial),
            formatCurrency(pago.cuotaBase ?? pago.cuotaConSegDes),
            formatCurrency(pago.interes),
            formatCurrency(pago.amortizacion),
            formatCurrency(pago.seguroDesgravamen),
            formatCurrency(pago.seguroRiesgo ?? pago.seguroInmueble),
            formatCurrency(pago.comision),
            formatCurrency(pago.portes),
            formatCurrency(pago.gastosAdmin),
            formatCurrency(pago.cuotaTotal),
            formatCurrency(pago.saldoFinal),
            formatCurrency(Math.abs(pago.flujo ?? pago.flujoNeto))
        ]);

        const tableRows = [headerRow, ...rows]
            .map(
                row => `<tr>${row
                    .map(value => `<td>${String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`)
                    .join('')}</tr>`
            )
            .join('');

        const tableHtml = [
            '<!DOCTYPE html>',
            '<html>',
            '  <head>',
            '    <meta charset="UTF-8" />',
            '  </head>',
            '  <body>',
            `    <table>${tableRows}</table>`,
            '  </body>',
            '</html>'
        ].join('\n');

        const blob = new Blob([`\ufeff${tableHtml}`], {
            type: 'application/vnd.ms-excel'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    /**
     * Limpia los errores
     */
    const clearError = () => {
        error.value = null;
    };

    return {
        // State
        simulacionActual,
        historialSimulaciones,
        loading,
        error,
        entidadesFinancieras,
        programasVivienda,

        // Computed
        tieneSimulacion,
        tieneCronograma,

        // Methods
        calcular,
        guardar,
        fetchHistorial,
        cargarSimulacion,
        eliminarSimulacion,
        limpiarSimulacion,
        fetchEntidadesFinancieras,
        fetchProgramasVivienda,
        fetchTasasEntidad,
        fetchBonoTechoPropio,
        fetchBonoBBP, // 🆕 NUEVA FUNCIÓN EXPORTADA
        fetchClienteConVivienda,
        exportarCronograma,
        clearError
    };
};