/**
 * Caso de uso: Buscar clientes
 */
export class SearchClientes {
    constructor(repository) {
        this.repository = repository;
    }

    /**
     * Ejecuta el caso de uso
     * @param {string} query - Término de búsqueda
     * @returns {Promise<Array>}
     */
    async execute(query) {
        try {
            if (!query || query.trim().length === 0) {
                return await this.repository.findAll();
            }

            const clientes = await this.repository.search(query.trim());
            return clientes;
        } catch (error) {
            console.error('Error en SearchClientes:', error);
            throw new Error('Error al buscar clientes');
        }
    }
}