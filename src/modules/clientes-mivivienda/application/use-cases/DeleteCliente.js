/**
 * Caso de uso: Eliminar un cliente
 */
export class DeleteCliente {
    constructor(repository) {
        this.repository = repository;
    }

    /**
     * Ejecuta el caso de uso
     * @param {number} id - ID del cliente
     * @returns {Promise<void>}
     */
    async execute(id) {
        try {
            if (!id || id <= 0) {
                throw new Error('ID inválido');
            }

            // Verificar que el cliente existe
            const clienteExistente = await this.repository.findById(id);
            if (!clienteExistente) {
                throw new Error('Cliente no encontrado');
            }

            // Eliminar del repositorio
            await this.repository.delete(id);

        } catch (error) {
            console.error('Error en DeleteCliente:', error);
            throw error;
        }
    }
}
