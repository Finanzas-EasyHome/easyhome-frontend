// src/modules/simulador/domain/repositories/SimuladorRepository.js

export class SimuladorRepository {

    async save(simulacion) {
        throw new Error("Method save() must be implemented");
    }

    async findAll() {
        throw new Error("Method findAll() must be implemented");
    }

    async findById(id) {
        throw new Error("Method findById() must be implemented");
    }

    async delete(id) {
        throw new Error("Method delete() must be implemented");
    }

    async getEntidadesFinancieras() {
        throw new Error("Method getEntidadesFinancieras() must be implemented");
    }

    async getProgramasVivienda() {
        throw new Error("Method getProgramasVivienda() must be implemented");
    }

    async getTasasEntidad(entidadId, programa) {
        throw new Error("Method getTasasEntidad() must be implemented");
    }

    async getCostosEntidad(entidadId) {
        throw new Error("Method getCostosEntidad() must be implemented");
    }
}

