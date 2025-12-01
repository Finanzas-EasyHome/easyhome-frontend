// src/modules/simulador/application/use-cases/GuardarSimulacion.js

/**
 * Caso de uso: Guardar simulación en Supabase
 *
 * ✅ IMPORTANTE:
 * Este caso de uso NO mapea campos porque el repositorio
 * (SimuladorRepositoryImpl.save()) ya hace todo el mapeo necesario.
 *
 * Solo valida y delega al repositorio.
 */
export class GuardarSimulacion {
    constructor(repository) {
        this.repository = repository;
    }

    /**
     * Ejecuta el guardado de la simulación
     * La simulación ya viene procesada desde CalcularSimulacion
     */
    async execute(simulacion) {
        try {
            // 1️⃣ Validar que existe la simulación
            if (!simulacion) {
                throw new Error("No hay simulación para guardar");
            }

            console.log('💾 GuardarSimulacion: Guardando simulación...', {
                clienteId: simulacion.clienteId,
                viviendaId: simulacion.viviendaId,
                entidadId: simulacion.entidadId,
                programa: simulacion.programa,
                montoFinanciado: simulacion.montoFinanciado
            });

            // 2️⃣ Delegar al repositorio (que hace el mapeo)
            // El repositorio se encarga de:
            // - Obtener user_id desde localStorage
            // - Mapear todos los campos a formato Supabase
            // - Insertar en la base de datos
            const simulacionGuardada = await this.repository.save(simulacion);

            console.log('✅ GuardarSimulacion: Simulación guardada exitosamente:', {
                id: simulacionGuardada.id,
                fecha_creacion: simulacionGuardada.fecha_creacion
            });

            return simulacionGuardada;

        } catch (error) {
            console.error("❌ GuardarSimulacion: Error al guardar:", error);
            throw error;
        }
    }
}