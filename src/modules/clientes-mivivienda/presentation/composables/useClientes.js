// src/modules/clientes-mivivienda/presentation/composables/useClientes.js

import { ref, computed } from 'vue';
import { ClienteRepositoryImplMV } from '../../infrastructure/repositories/ClienteRepositoryImplMV.js';
import { GetAllClientes } from '../../application/use-cases/GetAllClientes.js';
import { GetClienteById } from '../../application/use-cases/GetClienteById.js';
import { CreateCliente } from '../../application/use-cases/CreateCliente.js';
import { UpdateCliente } from '../../application/use-cases/UpdateCliente.js';
import { DeleteCliente } from '../../application/use-cases/DeleteCliente.js';

export const useClientes = () => {

    // State
    const clientes = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const searchQuery = ref('');

    // Repository & Use Cases
    const repository = new ClienteRepositoryImplMV();
    const getAllClientes = new GetAllClientes(repository);
    const getClienteById = new GetClienteById(repository);
    const createCliente = new CreateCliente(repository);
    const updateCliente = new UpdateCliente(repository);
    const deleteCliente = new DeleteCliente(repository);

    // Computed
    const filteredClientes = computed(() => {
        if (!searchQuery.value.trim()) return clientes.value;

        const query = searchQuery.value.toLowerCase();

        return clientes.value.filter(c =>
            c.nombresApellidos.toLowerCase().includes(query) ||
            c.dni.includes(query) ||
            c.estadoCivil.toLowerCase().includes(query)
        );
    });

    const totalClientes = computed(() => filteredClientes.value.length);

    // ============================================================
    //  Cargar lista completa
    // ============================================================
    const fetchClientes = async () => {
        loading.value = true;
        error.value = null;

        try {
            clientes.value = await getAllClientes.execute();
        } catch (e) {
            error.value = e.message || 'Error al cargar clientes';
            console.error(e);
        } finally {
            loading.value = false;
        }
    };

    // ============================================================
    //  Cargar cliente por ID
    // ============================================================
    const fetchClienteById = async (id) => {
        loading.value = true;
        error.value = null;

        try {
            return await getClienteById.execute(id);
        } catch (e) {
            error.value = e.message || 'Error al cargar el cliente';
            console.error(e);
            throw e;
        } finally {
            loading.value = false;
        }
    };

    // ============================================================
    //  Crear cliente (Supabase)
    // ============================================================
    const addCliente = async (clienteData) => {
        loading.value = true;
        error.value = null;

        try {
            await createCliente.execute(clienteData);
            await fetchClientes(); // ← Recargar lista
        } catch (e) {
            error.value = e.message || 'Error al crear cliente';
            console.error(e);
            throw e;
        } finally {
            loading.value = false;
        }
    };

    // ============================================================
    //  Actualizar cliente
    // ============================================================
    const modifyCliente = async (id, clienteData) => {
        loading.value = true;
        error.value = null;

        try {
            await updateCliente.execute(id, clienteData);
            await fetchClientes(); // ← Recargar lista también
        } catch (e) {
            error.value = e.message || 'Error al actualizar cliente';
            console.error(e);
            throw e;
        } finally {
            loading.value = false;
        }
    };

    // ============================================================
    //  Eliminar cliente
    // ============================================================
    const removeCliente = async (id) => {
        loading.value = true;
        error.value = null;

        try {
            await deleteCliente.execute(id);
            clientes.value = clientes.value.filter(c => c.id !== id);
        } catch (e) {
            error.value = e.message || 'Error al eliminar cliente';
            console.error(e);
            throw e;
        } finally {
            loading.value = false;
        }
    };

    // ============================================================
    // Búsqueda local
    // ============================================================
    const setSearchQuery = (query) => {
        searchQuery.value = query;
    };

    const clearError = () => (error.value = null);

    return {
        clientes: filteredClientes,
        allClientes: clientes,
        loading,
        error,
        searchQuery,
        totalClientes,

        fetchClientes,
        fetchClienteById,
        addCliente,
        modifyCliente,
        removeCliente,
        setSearchQuery,
        clearError
    };
};
