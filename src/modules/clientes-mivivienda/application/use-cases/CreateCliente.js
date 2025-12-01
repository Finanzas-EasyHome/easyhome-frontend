import { ClienteMV } from '../../domain/entities/ClienteMV.js';

/**
 * Caso de uso: Crear un nuevo cliente
 * NCMV
 */
export class CreateCliente {
    constructor(repository) {
        this.repository = repository;
    }

    /**
     * Ejecuta el caso de uso
     * @param {Object} clienteData - Datos del cliente
     * @returns {Promise<Object>}
     */
    async execute(clienteData) {
        try {
            // Crear entidad y validar
            const cliente = ClienteMV.create(clienteData);
            const validation = cliente.validate();

            if (!validation.valid) {
                throw new Error(validation.errors.join(', '));
            }

            // Crear en el repositorio
            const nuevoCliente = await this.repository.create(cliente.toCreateDTO());

            return nuevoCliente;
        } catch (error) {
            console.error('Error en CreateCliente:', error);
            throw error;
        }
    }
}
