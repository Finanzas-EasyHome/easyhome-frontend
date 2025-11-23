import { supabase } from "/src/shared/infrastructure/supabase.js";
import { ClienteRepository } from "../../domain/repositories/ClienteRepository.js";

export class ClienteRepositoryImpl extends ClienteRepository {

    // ============================================================
    //  LISTAR TODOS LOS CLIENTES (JOIN 1 → 1)
    // ============================================================
    async findAll() {
        const { data, error } = await supabase
            .from("clientes_techo_propio")
            .select(`
            *,
            vivienda:vivienda_techo_propio!fk_cliente (
            id,
                proyecto,
                tipo_vivienda,
                valor_vivienda,
                modalidad_vivienda,
                porcentaje_cuota_inicial,
                tipo_vis,
                ubicacion
            )
        `);

        if (error) throw new Error("Error al obtener clientes");

        return data.map(c => ({
            id: c.id,
            nombresApellidos: c.nombres_completos,
            dni: c.dni,
            edad: c.edad,
            ingresoFamiliar: c.ingreso_familiar,
            estadoCivil: c.estado_civil,
            tieneDiscapacidad: c.discapacidad,
            esMigranteRetornado: c.migrante_retornado,
            esPersonaDesplazada: c.persona_desplazada,

            aporte: c.vivienda
                ? Number(c.vivienda.valor_vivienda || 0) *
                (Number(c.vivienda.porcentaje_cuota_inicial || 0) / 100)
                : 0,

            vivienda: c.vivienda
                ? {
                    id: c.vivienda.id,
                    proyecto: c.vivienda.proyecto,
                    tipoVivienda: c.vivienda.tipo_vivienda,
                    valorVivienda: c.vivienda.valor_vivienda,
                    modalidadVivienda: c.vivienda.modalidad_vivienda,
                    cuotaInicial: Number(c.vivienda.valor_vivienda) * (Number(c.vivienda.porcentaje_cuota_inicial) / 100),
                    cuotaInicialPorcentaje: c.vivienda.porcentaje_cuota_inicial,
                    tipoVIS: c.vivienda.tipo_vis,
                    ubicacion: c.vivienda.ubicacion,
                }
                : null
        }));
    }

    async findById(id) {
        const { data, error } = await supabase
            .from("clientes_techo_propio")
            .select(`
            *,
            vivienda:vivienda_techo_propio!fk_cliente (
            id,
                proyecto,
                tipo_vivienda,
                valor_vivienda,
                modalidad_vivienda,
                porcentaje_cuota_inicial,
                tipo_vis,
                ubicacion
            )
        `)
            .eq("id", id)
            .maybeSingle();

        if (error) throw new Error("Error al obtener cliente");

        return {
            id: data.id,
            nombresApellidos: data.nombres_completos,
            dni: data.dni,
            edad: data.edad,
            ingresoFamiliar: data.ingreso_familiar,
            estadoCivil: data.estado_civil,
            tieneDiscapacidad: data.discapacidad,
            esMigranteRetornado: data.migrante_retornado,
            esPersonaDesplazada: data.persona_desplazada,

            aaporte: data.vivienda
                ? Number(data.vivienda.valor_vivienda || 0) *
                (Number(data.vivienda.porcentaje_cuota_inicial || 0) / 100)
                : 0,

            vivienda: data.vivienda
                ? {
                    proyecto: data.vivienda.proyecto,
                    tipoVivienda: data.vivienda.tipo_vivienda,
                    valorVivienda: data.vivienda.valor_vivienda,
                    modalidadVivienda: data.vivienda.modalidad_vivienda,
                    cuotaInicial: Number(data.vivienda.valor_vivienda) * (Number(data.vivienda.porcentaje_cuota_inicial) / 100),
                    cuotaInicialPorcentaje: data.vivienda.porcentaje_cuota_inicial,
                    tipoVIS: data.vivienda.tipo_vis,
                    ubicacion: data.vivienda.ubicacion,
                }
                : null
        };
    }


    async create(cliente) {

        // 1️⃣ Crear cliente
        const { data: newClient, error: clienteError } = await supabase
            .from("clientes_techo_propio")
            .insert({
                nombres_completos: cliente.nombresApellidos,
                dni: cliente.dni,
                edad: cliente.edad,
                ingreso_familiar: cliente.ingresoFamiliar,
                estado_civil: cliente.estadoCivil,
                discapacidad: cliente.tieneDiscapacidad,
                migrante_retornado: cliente.esMigranteRetornado,
                persona_desplazada: cliente.esPersonaDesplazada,
                fecha_registro: new Date()
            })
            .select()
            .maybeSingle();

        if (clienteError) throw new Error(clienteError.message);

        // 2️⃣ Crear vivienda
        const vivienda = cliente.vivienda;

        const { error: viviendaError } = await supabase
            .from("vivienda_techo_propio")
            .insert({
                cliente_id: newClient.id,
                proyecto: vivienda.proyecto,
                tipo_vivienda: vivienda.tipoVivienda,
                valor_vivienda: vivienda.valorVivienda,
                modalidad_vivienda: vivienda.modalidadVivienda,
                porcentaje_cuota_inicial: vivienda.cuotaInicialPorcentaje,
                tipo_vis: vivienda.tipoVIS,
                ubicacion: vivienda.ubicacion,
                fecha_registro: new Date()
            });

        if (viviendaError) throw new Error(viviendaError.message);

        return true;
    }


    async update(id, cliente) {
        // 1. actualizar cliente
        const { error } = await supabase
            .from("clientes_techo_propio")
            .update({
                nombres_completos: cliente.nombresApellidos,
                dni: cliente.dni,
                edad: cliente.edad,
                ingreso_familiar: cliente.ingresoFamiliar,
                estado_civil: cliente.estadoCivil,
                discapacidad: cliente.tieneDiscapacidad,
                migrante_retornado: cliente.esMigranteRetornado,
                persona_desplazada: cliente.esPersonaDesplazada,
                fecha_actualizacion: new Date()
            })
            .eq("id", id);

        if (error) throw new Error("Error al actualizar cliente");

        // 2. actualizar vivienda
        await supabase
            .from("vivienda_techo_propio")
            .update({
                proyecto: cliente.vivienda.proyecto,
                tipo_vivienda: cliente.vivienda.tipoVivienda,
                valor_vivienda: cliente.vivienda.valorVivienda,
                modalidad_vivienda: cliente.vivienda.modalidadVivienda,
                porcentaje_cuota_inicial: cliente.vivienda.cuotaInicialPorcentaje,
                tipo_vis: cliente.vivienda.tipoVIS,
                ubicacion: cliente.vivienda.ubicacion,
                fecha_actualizacion: new Date()
            })
            .eq("cliente_id", id);

        return true;
    }


    // ============================================================
    //  ELIMINAR CLIENTE (CASCADE)
    // ============================================================
    async delete(id) {
        const { error } = await supabase
            .from("clientes_techo_propio")
            .delete()
            .eq("id", id);

        if (error) throw new Error("Error al eliminar cliente");

        return true;
    }
}
