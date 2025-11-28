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

            // relaciones
            cliente_tp_id: sim.cliente_id ?? null,
            entidad_id: sim.entidad_financiera ?? null,

            // datos base
            programa: sim.programa_objetivo,
            valor_vivienda: sim.valor_vivienda,
            bono_monto: sim.monto_bono,

            // cuota inicial
            cuota_inicial_porcentaje: sim.cuota_inicial_porcentaje,
            cuota_inicial_monto: sim.cuota_inicial,

            // financiado
            saldo_financiar: sim.monto_financiado,   // <-- OK

            // tasas
            tipo_tasa: "TEA",
            tasa_valor: sim.tasa_interes,
            tasa_descuento: sim.tasa_descuento ?? 0,

            // plazo
            plazo_tipo: "meses",
            plazo_valor: sim.plazo_prestamo,

            // periodo gracia
            gracia_tipo: sim.tipo_periodo_gracia,
            gracia_meses: sim.periodo_gracia,

            // costos
            seguro_desgravamen: sim.seguro_desgravamen,
            seguro_inmueble: sim.seguro_inmueble,
            tasacion: sim.tasacion,
            gastos_notariales: sim.gastos_notariales,
            gastos_registrales: sim.gastos_registrales,
            cargos_administrativos: sim.cargos_administrativos ?? 0,
            comision_desembolso: sim.comision_desembolso,

            // resultados
            cuota: sim.cuota_mensual,       // <-- el correcto
            tcea: sim.tcea,
            van: sim.van,
            tir: sim.tir,

            // fechas
            fecha_inicio_pago: sim.fecha_inicio_pago,
            fecha_creacion: new Date().toISOString(),

            // usuario
            user_id: sim.user_id ?? null
        };
    }

}
