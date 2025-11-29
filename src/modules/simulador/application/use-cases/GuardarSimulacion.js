// src/modules/simulador/application/use-cases/GuardarSimulacion.js

/**
 * Caso de uso: Guardar simulación en Supabase
 */
export class GuardarSimulacion {
    constructor(repository) {
        this.repository = repository;
    }

    /**
     * Ejecuta el guardado de la simulación
     * Aquí ya NO se vuelve a validar ni calcular,
     * porque la simulación ya viene procesada desde CalcularSimulacion.
     */
    async execute(simulacion) {
        try {

            if (!simulacion) {
                throw new Error("No hay simulación para guardar");
            }

            // Obtener usuario actual (si existe)
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                simulacion.userId = user.id;
            }

            // Adaptar los campos EXACTOS para Supabase
            const dataParaGuardar = this.mapearAFormatoSupabase(simulacion);

            // Guardar en repositorio
            const simulacionGuardada = await this.repository.save(dataParaGuardar);

            return simulacionGuardada;

        } catch (error) {
            console.error("Error en GuardarSimulacion:", error);
            throw error;
        }
    }

    /**
     * Mapea los nombres internos del simulador
     * a los nombres exactos que necesita Supabase
     */
    mapearAFormatoSupabase(sim) {

        return {
            id: sim.id ?? crypto.randomUUID(),

            // RELACIONES (modo Techo Propio)
            cliente_tp_id: sim.clienteId ?? null,
            cliente_ncmv_id: null,

            vivienda_tp_id: sim.viviendaId ?? null,    // <<-- debes asignar sim.viviendaId cuando cargues la vivienda
            vivienda_ncmv_id: null,

            // DATOS BASE
            programa: sim.programa,
            valor_vivienda: sim.valorVivienda,
            bono_monto: sim.montoBono,

            // CUOTA INICIAL
            cuota_inicial_porcentaje: sim.cuotaInicialPorcentaje,
            cuota_inicial_monto: sim.cuotaInicial,

            // FINANCIADO
            saldo_financiar: sim.montoFinanciado,

            // TASAS
            tipo_tasa: sim.tipoTasa,
            tasa_valor: sim.tasaInteres,
            tasa_descuento: sim.tasaDescuento ?? 0,

            // COSTOS (NOMBRES EXACTOS DE SUPABASE)
            seguro_desgravamen: sim.seguroDesgravamen,
            seguro_inmueble: sim.seguroInmueble,
            cargos_admin: sim.cargosAdmin ?? 0,
            tasacion: sim.tasacion,
            gastos_notariales: sim.gastosNotariales,
            gastos_registrales: sim.gastosRegistrales,
            comision_envio: sim.comisionDesembolso,

            // PLAZO Y GRACIA
            plazo_tipo: sim.plazoTipo,
            plazo_valor: sim.plazoPrestamo,
            gracia_tipo: sim.tipoPeriodoGracia,
            gracia_meses: sim.periodoGracia,

            // FECHAS
            fecha_inicio_pago: sim.fechaInicioPago,
            fecha_creacion: new Date().toISOString(),

            // RESULTADOS
            cuota: sim.cuotaMensual,
            tcea: sim.tcea,
            van: sim.van,
            tir: sim.tir,

            // USUARIO
            user_id: sim.userId ?? null
        };
    }

}
