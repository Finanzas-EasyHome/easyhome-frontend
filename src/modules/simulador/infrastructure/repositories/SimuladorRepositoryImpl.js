// src/modules/simulador/infrastructure/repositories/SimuladorRepositoryImpl.js

import { supabase } from '/src/shared/infrastructure/supabase.js';
import { SimuladorRepository } from '/src/modules/simulador/domain/repositories/SimuladorRepository.js';
import { Simulacion } from '../../domain/entities/Simulacion';
export class SimuladorRepositoryImpl extends SimuladorRepository {
    constructor() {
        super();
    }
    // ============================================================
    // USUARIO ACTUAL
    // ============================================================
    getCurrentUserId() {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            throw new Error('No hay usuario autenticado');
        }
        try {
            const user = JSON.parse(userStr);
            // Ajusta esto si guardas el usuario de otra forma
            return user.id;
        } catch (e) {
            throw new Error('Error al obtener usuario actual');
        }
    }

    // ============================================================
    // ENTIDADES FINANCIERAS
    // ============================================================
    /**
     * Lista de entidades financieras para el combo
     */
    async getEntidadesFinancieras() {
        const { data, error } = await supabase
            .from('entidades_financieras')
            .select('id, nombre, tp_tea_min, tp_tea_max, ncmv_tea_min, ncmv_tea_max')
            .order('nombre', { ascending: true });

        if (error) {
            console.error('Error al obtener entidades financieras', error);
            throw new Error('No se pudieron cargar las entidades financieras');
        }

        // value/label para el select + rangos de TEA
        return data.map((entidad) => ({
            id: entidad.id,
            value: entidad.id,          // usa el uuid como value
            label: entidad.nombre,
            tpTeaMin: Number(entidad.tp_tea_min ?? 0),
            tpTeaMax: Number(entidad.tp_tea_max ?? 0),
            ncmvTeaMin: Number(entidad.ncmv_tea_min ?? 0),
            ncmvTeaMax: Number(entidad.ncmv_tea_max ?? 0),
        }));
    }


    /**
     * Obtiene el rango de tasas TEA de una entidad según programa.
     * programa: 'techoPropio' | 'miVivienda' | 'miViviendaVerde' | 'convencional'
     */
    async getTasasEntidad(entidadId, programa = 'miVivienda') {
        const { data, error } = await supabase
            .from('entidades_financieras')
            .select('tp_tea_min, tp_tea_max, ncmv_tea_min, ncmv_tea_max')
            .eq('id', entidadId)
            .single();

        if (error) {
            console.error('Error al obtener tasas de entidad', error);
            throw new Error('No se pudo obtener la tasa de la entidad seleccionada');
        }

        const isTechoPropio = programa === 'techoPropio';

        const min = isTechoPropio ? data.tp_tea_min : data.ncmv_tea_min;
        const max = isTechoPropio ? data.tp_tea_max : data.ncmv_tea_max;

        const minNum = Number(min ?? 0);
        const maxNum = Number(max ?? 0);

        return {
            min: minNum,
            max: maxNum,
            promedio: Number(((minNum + maxNum) / 2).toFixed(4)),
        };
    }



    async getCostosEntidad(entidadId) {
        try {
            const { data, error } = await supabase
                .from("entidades_costos_adicionales")
                .select("*")
                .eq("entidad_id", entidadId)
                .maybeSingle();

            if (error) throw new Error(error.message);
            if (!data) throw new Error("No existen costos para esta entidad.");

            return {
                seguroDesgravamen: {
                    min: data.seguro_desgravamen_min,
                    max: data.seguro_desgravamen_max
                },
                seguroInmueble: {
                    min: data.seguro_inmueble_min,
                    max: data.seguro_inmueble_max
                },
                tasacion: {
                    min: data.tasacion_min,
                    max: data.tasacion_max
                },
                gastosNotariales: {
                    min: data.gastos_notariales_min,
                    max: data.gastos_notariales_max
                },
                gastosRegistrales: {
                    min: data.gastos_registrales_min,
                    max: data.gastos_registrales_max
                },
                cargosAdministrativos: {
                    min: data.cargos_admin_min,
                    max: data.cargos_admin_max
                },

                comisionDesembolso: Number(data.comision_envio ?? 0)
            };

        } catch (err) {
            console.error("Error getCostosEntidad:", err);
            throw new Error("Error obteniendo costos adicionales");
        }
    }
    async getBonoTechoPropio(modalidad, tipoVis) {
        try {
            const { data, error } = await supabase
                .from("bono_techo_propio")
                .select("monto")
                .eq("modalidad_vivienda", modalidad)
                .eq("tipo_vis", tipoVis)
                .maybeSingle();

            if (error) {
                console.error("Error obteniendo bono techo propio:", error);
                throw new Error("No se pudo obtener el bono para la combinación seleccionada");
            }

            if (!data) {
                // No hay bono para esa combinación → 0
                return 0;
            }

            return Number(data.monto ?? 0);
        } catch (err) {
            console.error("Error getBonoTechoPropio:", err);
            throw err;
        }
    }
    async getBonoBBP(rango, tipoBBP) {
        try {
            console.log(`🔍 Consultando bono_bbp: rango="${rango}", tipo_bbp="${tipoBBP}"`);

            const { data, error } = await supabase
                .from('bono_bbp')
                .select('monto')
                .eq('rango', rango)
                .eq('tipo_bbp', tipoBBP);

            if (error) {
                console.error('❌ Error Supabase:', error);
                throw error;
            }

            console.log(`📊 Resultados encontrados:`, data);

            if (!data || data.length === 0) {
                throw new Error(`No se encontró bono para ${rango} - ${tipoBBP}`);
            }

            // Tomar el primer resultado si hay múltiples
            return data[0];

        } catch (err) {
            console.error('Error getBonoBBP:', err);
            throw err;
        }
    }

    // ============================================================
    // CLIENTES Y VIVIENDAS - TECHO PROPIO
    // ============================================================
    async getClienteConVivienda(clienteId) {
        try {
            const { data, error } = await supabase
                .from("clientes_techo_propio")
                .select(`
            *,
             vivienda:vivienda_techo_propio!vivienda_techo_propio_fk_cliente_fkey(
                id,
                proyecto,
                tipo_vivienda,
                valor_vivienda,
                modalidad_vivienda,
                porcentaje_cuota_inicial,
                tipo_vis,
                ubicacion,
                fecha_registro
            )
        `)
                .eq("id", clienteId)
                .single();

            if (error) {
                console.error("Error obteniendo cliente/vivienda:", error);
                throw new Error("No se pudo obtener los datos del cliente");
            }
            if (Array.isArray(data.vivienda)) {
                data.vivienda = data.vivienda[0] ?? null;
            }

            return data;

        } catch (err) {
            console.error("Error getClienteConVivienda:", err);
            throw new Error("Error obteniendo datos del cliente");
        }
    }

    // ============================================================
    // CLIENTES Y VIVIENDAS - NCMV (NUEVO CRÉDITO MIVIVIENDA)
    // ============================================================
    /**
     * Obtiene cliente y vivienda de NCMV (Nuevo Crédito MiVivienda)
     */
    async getClienteConViviendaNCMV(clienteId) {
        try {
            const { data, error } = await supabase
                .from("clientes_ncmv")
                .select(`
                *,
                vivienda:viviendas_ncmv!fk_cliente(
                    id,
                    proyecto,
                    tipo_vivienda,
                    valor_vivienda,
                    vivienda_sostenible,
                    bono_bbp,
                    porcentaje_cuota_inicial,
                    tipo_bbp,
                    ubicacion,
                    fecha_registro
                )
            `)
                .eq("id", clienteId)
                .single();

            if (error) {
                console.error("Error obteniendo cliente NCMV/vivienda:", error);
                throw new Error("No se pudo obtener los datos del cliente NCMV");
            }

            if (Array.isArray(data.vivienda)) {
                data.vivienda = data.vivienda[0] ?? null;
            }

            return data;

        } catch (err) {
            console.error("Error getClienteConViviendaNCMV:", err);
            throw new Error("Error obteniendo datos del cliente NCMV");
        }
    }
    // ============================================================
    // OBTENER CLIENTES POR PROGRAMA
    // ============================================================
    /**
     * Obtiene todos los clientes según el programa
     */
    async getClientesPorPrograma(programa) {
        try {
            const esNCMV = programa === 'miVivienda' ||
                programa === 'miViviendaVerde' ||
                programa === 'convencional';

            const tabla = esNCMV ? 'clientes_ncmv' : 'clientes_techo_propio';

            console.log(`🔍 Buscando clientes en tabla: ${tabla} para programa: ${programa}`);

            const { data, error } = await supabase
                .from(tabla)
                .select('id, nombres_completos')
                .order('nombres_completos', { ascending: true });

            if (error) {
                console.error(`Error obteniendo clientes de ${tabla}:`, error);
                throw new Error(`No se pudieron cargar los clientes de ${programa}`);
            }

            const clientes = data.map(cliente => ({
                id: cliente.id,
                nombresApellidos: cliente.nombres_completos
            }));

            console.log(`✅ ${clientes.length} clientes encontrados en ${tabla}`);
            return clientes;

        } catch (err) {
            console.error("Error getClientesPorPrograma:", err);
            throw err;
        }
    }


    // ============================================================
    // PROGRAMAS DE VIVIENDA (por ahora estático)
    // ============================================================
    async getProgramasVivienda() {
        return [
            { value: 'techoPropio', label: 'Techo Propio' },
            { value: 'miVivienda', label: 'Nuevo Crédito MiVivienda' },
        ];
    }

    // ============================================================
    // SIMULACIONES (HISTORIAL)
    // ============================================================
    /**
     * Guarda una simulación de plan de pagos.
     * `simulacion` viene del formulario + resultados (montoFinanciado, tcea, van, tir, cuota, etc).
     */
    async save(simulacion) {
        try {
            const userId = this.getCurrentUserId();

            const payload = {
                id: simulacion.id ?? crypto.randomUUID(),
                user_id: userId,

                // ✅ RELACIONES - Asegurarse de capturar viviendaId correctamente
                cliente_tp_id: simulacion.clienteId ?? null,
                cliente_ncmv_id: null,

                // ⚠️ CRÍTICO: Asegurarse de que viviendaId se mapee correctamente
                vivienda_tp_id: simulacion.viviendaId ?? simulacion.vivienda_tp_id ?? null,
                vivienda_ncmv_id: null,

                entidad_id: simulacion.entidadId ?? simulacion.entidad_id ?? null,

                // DATOS BASE
                programa: simulacion.programa,
                valor_vivienda: simulacion.valorVivienda,

                cuota_inicial_porcentaje: simulacion.cuotaInicialPorcentaje,
                cuota_inicial_monto: simulacion.cuotaInicial,

                bono_monto: simulacion.montoBono,
                saldo_financiar: simulacion.montoFinanciado,

                // TASAS
                tipo_tasa: "TEA",
                tasa_valor: simulacion.tasaInteres,
                tasa_descuento: simulacion.tasaDescuento ?? simulacion.tasaDescuentoCOK ?? 0,

                // COSTOS
                seguro_desgravamen: simulacion.seguroDesgravamen ?? simulacion.seguroDesgravamenPorcentaje ?? 0,
                seguro_inmueble: simulacion.seguroInmueble ?? simulacion.seguroInmuebleAnual ?? 0,
                cargos_admin: simulacion.cargosAdmin ?? simulacion.cargosAdministrativos ?? 0,
                tasacion: simulacion.tasacion ?? 0,
                gastos_notariales: simulacion.gastosNotariales ?? 0,
                gastos_registrales: simulacion.gastosRegistrales ?? 0,
                comision_envio: simulacion.comisionDesembolso ?? simulacion.comision ?? 0,

                // PLAZO
                plazo_tipo: simulacion.plazoTipo ?? "meses",
                plazo_valor: simulacion.plazoPrestamo,

                // GRACIA
                gracia_tipo: simulacion.tipoPeriodoGracia,
                gracia_meses: simulacion.periodoGracia,

                fecha_inicio_pago: simulacion.fechaInicioPago,
                fecha_creacion: new Date().toISOString(),

                // RESULTADOS
                cuota: simulacion.cuotaMensual,
                tcea: simulacion.tcea,
                van: simulacion.van,
                tir: simulacion.tir
            };

            console.log('📤 PAYLOAD COMPLETO PARA SUPABASE:', payload);

            const { data, error } = await supabase
                .from('simulaciones_plan_de_pagos')
                .insert(payload)
                .select()
                .single();

            if (error) {
                console.error("❌ SUPABASE ERROR:", error);
                console.error("❌ PAYLOAD ENVIADO:", payload);
                console.error("❌ ERROR COMPLETO:", JSON.stringify(error, null, 2));
                throw error;
            }

            console.log('✅ SIMULACIÓN GUARDADA EN SUPABASE:', data);
            return data;

        } catch (error) {
            console.error('❌ Error en save():', error);
            throw error;
        }
    }

    /**
     * Lista de simulaciones del usuario actual.
     */
    async findAll() {
        try {
            const userId = this.getCurrentUserId();

            const { data, error } = await supabase
                .from('simulaciones_plan_de_pagos')
                .select(
                    `
          id,
          fecha_creacion,
          programa,
          valor_vivienda,
          saldo_financiar,
          tcea,
          van,
          tir,
          cuota,
          cliente:clientes_techo_propio!cliente_tp_id ( id, nombres, apellidos ),
          entidad:entidades_financieras!entidad_id ( id, nombre )
        `
                )
                .eq('user_id', userId)
                .order('fecha_creacion', { ascending: false });

            if (error) {
                console.error('Error al obtener simulaciones:', error);
                throw new Error('No se pudo obtener el historial de simulaciones');
            }

            return data;
        } catch (error) {
            console.error('Error en findAll:', error);
            throw error;
        }
    }

    /**
     * Obtiene una simulación por ID (ver detalle + cronograma si luego lo conectas).
     */
    async findById(id) {
        try {
            const userId = this.getCurrentUserId();

            const { data, error } = await supabase
                .from('simulaciones_plan_de_pagos')
                .select(
                    `
          *,
          cliente:clientes_techo_propio!cliente_tp_id ( * ),
          vivienda:vivienda_techo_propio!vivienda_tp_id ( * ),
          entidad:entidades_financieras!entidad_id ( * )
        `
                )
                .eq('id', id)
                .eq('user_id', userId)
                .single();

            if (error) {
                // PGRST116 = no rows returned
                if (error.code === 'PGRST116') {
                    return null;
                }
                console.error('Error al obtener simulación por ID:', error);
                throw new Error('No se pudo obtener la simulación');
            }

            return data;
        } catch (error) {
            console.error('Error en findById:', error);
            throw error;
        }
    }

    /**
     * Elimina una simulación (solo la del usuario actual)
     */
    async delete(id) {
        try {
            const userId = this.getCurrentUserId();

            const { error } = await supabase
                .from('simulaciones_plan_de_pagos')
                .delete()
                .eq('id', id)
                .eq('user_id', userId);

            if (error) {
                console.error('Error al eliminar simulación:', error);
                throw new Error('No se pudo eliminar la simulación');
            }
        } catch (error) {
            console.error('Error en delete:', error);
            throw error;
        }
    }
}