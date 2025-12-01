export class GetAllClientes {
    constructor(repository) {
        this.repository = repository;
    }

    /**
     * Ejecuta el caso de uso
     * @returns {Promise<Array>}
     */
    async execute() {
        try {
            const clientes = await this.repository.findAll();
            return clientes;
        } catch (error) {
            console.error('Error en GetAllClientes:', error);
            throw new Error('No se pudieron obtener los clientes');
        }
    }
}