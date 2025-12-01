/**
* Caso de uso: Obtener un cliente por ID
*/
export class GetClienteById {
    constructor(repository) {
        this.repository = repository;
    }

    /**
     * Ejecuta el caso de uso
     * @param {number} id - ID del cliente
     * @returns {Promise<Object|null>}
     * comentario prueba nohely
     */
    async execute(id) {
        try {
            if (!id || id <= 0) {
                throw new Error('ID inválido');
            }

            const cliente = await this.repository.findById(id);

            if (!cliente) {
                throw new Error('Cliente no encontrado');
            }

            return cliente;
        } catch (error) {
            console.error('Error en GetClienteById:', error);
            throw error;
        }
    }
}