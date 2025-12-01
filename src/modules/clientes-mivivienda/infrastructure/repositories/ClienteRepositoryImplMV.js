import { supabase } from "/src/shared/infrastructure/supabase.js";
import { ClienteRepositoryMV } from "../../domain/repositories/ClienteRepositoryMV.js";

export class ClienteRepositoryImplMV extends ClienteRepositoryMV {

    // ============================================================
    //  LISTAR TODOS LOS CLIENTES (JOIN 1 → 1)
    // ============================================================
    async findAll() {
        const { data, error } = await supabase
            .from("clientes_ncmv")
            .select(`
            *,
            vivienda:viviendas_ncmv!fk_cliente (
            id,
                proyecto,
                tipo_vivienda,
                valor_vivienda,
                porcentaje_cuota_inicial,
                vivienda_sostenible,
                bono_bbp,
                tipo_bbp,
                ubicacion
            )
        `);

        if (error) throw new Error("Error al obtener clientes");

        return data.map(c => {
            const v = Array.isArray(c.vivienda) ? c.vivienda[0] : c.vivienda;
            return {
                id: c.id,
                nombresApellidos: c.nombres_completos,
                dni: c.dni,
                edad: c.edad,
                ingresoFamiliar: c.ingreso_familiar,
                estadoCivil: c.estado_civil,
                tieneDiscapacidad: c.discapacidad,
                esMigranteRetornado: c.migrante_retornado,
                esPersonaDesplazada: c.persona_desplazada,

                aporte: v
                    ? Number(v.valor_vivienda || 0) *
                    (Number(v.porcentaje_cuota_inicial || 0) / 100)
                    : 0,

                vivienda: v
                    ? {
                        id: v.id,
                        proyecto: v.proyecto,
                        tipoVivienda: v.tipo_vivienda,
                        valorVivienda: v.valor_vivienda,
                        viviendaSostenible: v.vivienda_sostenible,
                        cuotaInicial:
                            Number(v.valor_vivienda) *
                            (Number(v.porcentaje_cuota_inicial) / 100),
                        cuotaInicialPorcentaje: v.porcentaje_cuota_inicial,
                        tipoBBP: v.tipo_bbp,
                        ubicacion: v.ubicacion,
                    }
                    : null
            };
        });
    }

    async findById(id) {
        const { data, error } = await supabase
            .from("clientes_ncmv")
            .select(`
            *,
            vivienda:viviendas_ncmv!fk_cliente (
                id,
                proyecto,
                tipo_vivienda,
                valor_vivienda,
                vivenda_sostenible,
                bono_bbp,
                porcentaje_cuota_inicial,
                tipo_bbp,
                ubicacion
            )
        `)
            .eq("id", id)
            .maybeSingle();

        if (error) throw new Error("Error al obtener cliente");

        const v = Array.isArray(data.vivienda) ? data.vivienda[0] : data.vivienda;

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

            aporte: v
                ? Number(v.valor_vivienda || 0) *
                (Number(v.porcentaje_cuota_inicial || 0) / 100)
                : 0,

            vivienda: v
                ? {
                    id: v.id,
                    proyecto: v.proyecto,
                    tipoVivienda: v.tipo_vivienda,
                    valorVivienda: v.valor_vivienda,
                    viviendaSostenible: v.vivienda_sostenible,
                    cuotaInicial:
                        Number(v.valor_vivienda) *
                        (Number(v.porcentaje_cuota_inicial) / 100),
                    cuotaInicialPorcentaje: v.porcentaje_cuota_inicial,
                    tipoBBP: v.tipo_bbp,
                    ubicacion: v.ubicacion,
                }
                : null
        };
    }

    async create(cliente) {

        // 1 Crear cliente
        const { data: newClient, error: clienteError } = await supabase
            .from("clientes_ncmv")
            .insert({
                nombres_completos: cliente.nombresApellidos,
                dni: cliente.dni,
                edad: cliente.edad,
                ingreso_familiar: cliente.ingresoFamiliar,
                aporte: cliente.aporte,
                estado_civil: cliente.estadoCivil,
                discapacidad: cliente.tieneDiscapacidad,
                migrante_retornado: cliente.esMigranteRetornado,
                persona_desplazada: cliente.esPersonaDesplazada,
                fecha_registro: new Date()
            })
            .select()
            .maybeSingle();

        if (clienteError) throw new Error(clienteError.message);

        // 2️ Crear vivienda
        const vivienda = cliente.vivienda;

        const { error: viviendaError } = await supabase
            .from("viviendas_ncmv")
            .insert({
                fk_cliente: newClient.id,
                proyecto: vivienda.proyecto,
                tipo_vivienda: vivienda.tipoVivienda,
                valor_vivienda: vivienda.valorVivienda,
                vivienda_sostenible: vivienda.viviendaSostenible,
                bono_bbp: vivienda.bonoBbp,
                porcentaje_cuota_inicial: vivienda.cuotaInicialPorcentaje,
                tipo_bbp: vivienda.tipoBBP,
                ubicacion: vivienda.ubicacion,
                fecha_registro: new Date()
            });

        if (viviendaError) throw new Error(viviendaError.message);

        return true;
    }


    async update(id, cliente) {
        console.log('===== INICIO UPDATE =====');
        console.log('ID del cliente:', id);
        console.log('Datos recibidos:', cliente);

        const valorVivienda = Number(cliente.vivienda?.valorVivienda) || 0;
        const porcentaje = Number(cliente.vivienda?.cuotaInicialPorcentaje) || 0;
        const aporteCalculado = Number((valorVivienda * (porcentaje / 100)).toFixed(2));

        console.log('Cálculo de aporte:', {
            valorVivienda,
            porcentaje,
            aporteCalculado
        });

        // Actualizar cliente
        const { error: clienteError } = await supabase
            .from("clientes_ncmv")
            .update({
                nombres_completos: cliente.nombresApellidos,
                dni: cliente.dni,
                edad: cliente.edad,
                ingreso_familiar: Number(cliente.ingresoFamiliar),
                aporte: aporteCalculado,
                estado_civil: cliente.estadoCivil,
                discapacidad: cliente.tieneDiscapacidad,
                migrante_retornado: cliente.esMigranteRetornado,
                persona_desplazada: cliente.esPersonaDesplazada

            })
            .eq("id", id);

        if (clienteError) {
            console.error('Error al actualizar cliente:', clienteError);
            throw new Error(`Error al actualizar cliente: ${clienteError.message}`);
        }

        console.log('Cliente actualizado correctamente');

        if (!cliente.vivienda?.id) {
            console.error('No hay ID de vivienda');
            throw new Error("No se encontró el ID de la vivienda para actualizar");
        }

        console.log('ID de vivienda:', cliente.vivienda.id);

        // Actualizar vivienda
        const { error: viviendaError } = await supabase
            .from("viviendas_ncmv")
            .update({
                proyecto: cliente.vivienda.proyecto,
                tipo_vivienda: cliente.vivienda.tipoVivienda,
                valor_vivienda: Number(cliente.vivienda.valorVivienda),
                viviendaSostenible: Number(cliente.vivienda.viviendaSostenible),
                bono_bbp: Number(cliente.vivienda.bonoBbp),
                porcentaje_cuota_inicial: Number(cliente.vivienda.cuotaInicialPorcentaje),
                tipo_bbp: cliente.vivienda.tipoBBP,
                ubicacion: cliente.vivienda.ubicacion

            })
            .eq("id", cliente.vivienda.id);

        if (viviendaError) {
            console.error('Error al actualizar vivienda:', viviendaError);
            throw new Error(`Error al actualizar vivienda: ${viviendaError.message}`);
        }

        console.log('Vivienda actualizada correctamente');
        console.log('===== FIN UPDATE =====');

        return true;
    }
    // ============================================================
    //  ELIMINAR CLIENTE (CASCADE)
    // ============================================================
    async delete(id) {
        const { error } = await supabase
            .from("clientes_ncmv")
            .delete()
            .eq("id", id);

        if (error) throw new Error("Error al eliminar cliente");

        return true;
    }
}
