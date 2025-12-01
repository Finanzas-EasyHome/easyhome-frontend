// src/modules/clientes/domain/repositories/ClienteRepository.js

/**
 * Interface del Repositorio de Clientes
 * Define el contrato que debe cumplir cualquier implementación
 */
export class ClienteRepositoryMV {
    /**
     * Obtiene todos los clientes
     * @returns {Promise<Array>}
     */
    async findAll() {
        throw new Error('Method findAll() must be implemented');
    }

    /**
     * Obtiene un cliente por su ID
     * @param {number} id - ID del cliente
     * @returns {Promise<Object|null>}
     */
    async findById(id) {
        throw new Error('Method findById() must be implemented');
    }

    /**
     * Crea un nuevo cliente
     * @param {Object} cliente - Datos del cliente
     * @returns {Promise<Object>}
     */
    async create(cliente) {
        throw new Error('Method create() must be implemented');
    }

    /**
     * Actualiza un cliente existente
     * @param {number} id - ID del cliente
     * @param {Object} cliente - Datos actualizados del cliente
     * @returns {Promise<Object>}
     */
    async update(id, cliente) {
        throw new Error('Method update() must be implemented');
    }

    /**
     * Elimina un cliente
     * @param {number} id - ID del cliente
     * @returns {Promise<void>}
     */
    async delete(id) {
        throw new Error('Method delete() must be implemented');
    }

    /**
     * Busca clientes por un término de búsqueda
     * @param {string} query - Término de búsqueda
     * @returns {Promise<Array>}
     */
    async search(query) {
        throw new Error('Method search() must be implemented');
    }
}