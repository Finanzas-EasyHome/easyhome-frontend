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
            cliente_id: sim.clienteId,
            entidad_id: sim.entidadId,
            programa: sim.programa,
            tasa: sim.tasaValor,
            plazo: sim.plazoValor,
            cuota_inicial: sim.cuotaInicial,
            monto_financiar: sim.saldoFinanciar,
            cuota_mensual: sim.cuota,
            tcea: sim.tcea,
            van: sim.van,
            tir: sim.tir,
            tasa_descuento: sim.tasaDescuento,

            // costos adicionales
            seguro_desgravamen: sim.seguroDesgravamen,
            seguro_inmueble: sim.seguroInmueble,
            tasacion: sim.tasacion,
            gastos_notariales: sim.gastosNotariales,
            comision_envio: sim.comisionEnvio,

            // gracia
            gracia_tipo: sim.graciaTipo,
            gracia_meses: sim.graciaMeses,

            // datos de control
            fecha_inicio_pago: sim.fechaInicioPago,
            user_id: sim.userId
        };
    }
}
