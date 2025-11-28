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

            // relación
            cliente_tp_id: sim.clienteTpId,
            cliente_ncmv_id: sim.clienteNcmvId,
            vivienda_tp_id: sim.viviendaTpId,
            vivienda_ncmv_id: sim.viviendaNcmvId,

            // datos base
            programa: sim.programa,
            valor_vivienda: sim.valorVivienda,
            bono_monto: sim.bonoMonto,

            // cuota inicial
            cuota_inicial_porcentaje: sim.cuotaInicialPorcentaje,
            cuota_inicial_monto: sim.cuotaInicial,

            // financiado
            saldo_financiar: sim.saldoFinanciar,

            // tasas
            tipo_tasa: "TEA",
            tasa_valor: sim.tasaValor,
            tasa_descuento: sim.tasaDescuento,

            // plazo
            plazo_tipo: "años",
            plazo_valor: sim.plazoValor,

            // periodo gracia
            gracia_tipo: sim.graciaTipo,
            gracia_meses: sim.graciaMeses,

            // costos
            seguro_desgravamen: sim.seguroDesgravamen,
            seguro_inmueble: sim.seguroInmueble,
            tasacion: sim.tasacion,
            gastos_notariales: sim.gastosNotariales,
            gastos_registrales: sim.gastosRegistrales,
            comision_envio: sim.comisionEnvio,

            // resultados
            cuota_mensual: sim.cuota,
            tcea: sim.tcea,
            van: sim.van,
            tir: sim.tir,

            // fechas
            fecha_inicio_pago: sim.fechaInicioPago,
            fecha_creacion: new Date().toISOString(),

            // usuario
            user_id: sim.userId
        };
    }

}
