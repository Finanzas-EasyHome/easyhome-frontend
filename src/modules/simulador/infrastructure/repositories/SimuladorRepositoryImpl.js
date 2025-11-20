// src/modules/simulador/infrastructure/repositories/SimuladorRepositoryImpl.js

import axios from 'axios';
import { SimuladorRepository } from '/src/modules/simulador/domain/repositories/SimuladorRepository.js';

export class SimuladorRepositoryImpl extends SimuladorRepository {
    constructor() {
        super();
        this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        this.endpoint = `${this.baseUrl}/simulaciones`;
    }

    /**
     * Obtiene el ID del usuario actual
     */
    getCurrentUserId() {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            throw new Error('No hay usuario autenticado');
        }
        try {
            const user = JSON.parse(userStr);
            return user.id;
        } catch (error) {
            throw new Error('Error al obtener usuario actual');
        }
    }

    /**
     * Guarda una simulación
     */
    async save(simulacion) {
        try {
            const userId = this.getCurrentUserId();

            const simulacionConDatos = {
                ...simulacion,
                userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const response = await axios.post(this.endpoint, simulacionConDatos);
            return response.data;
        } catch (error) {
            console.error('Error al guardar simulación:', error);
            this.handleError(error, 'Error al guardar la simulación');
        }
    }

    /**
     * Obtiene el historial de simulaciones del usuario
     */
    async findAll() {
        try {
            const userId = this.getCurrentUserId();

            const response = await axios.get(this.endpoint, {
                params: { userId }
            });

            // Ordenar por fecha de creación descendente
            const simulaciones = response.data.sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );

            return simulaciones;
        } catch (error) {
            console.error('Error al obtener simulaciones:', error);
            this.handleError(error, 'Error al obtener el historial de simulaciones');
        }
    }

    /**
     * Obtiene una simulación por ID
     */
    async findById(id) {
        try {
            const response = await axios.get(`${this.endpoint}/${id}`);
            const simulacion = response.data;

            // Verificar que la simulación pertenece al usuario actual
            const userId = this.getCurrentUserId();
            if (simulacion.userId !== userId) {
                throw new Error('No tienes permiso para ver esta simulación');
            }

            return simulacion;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            console.error('Error al obtener simulación por ID:', error);
            this.handleError(error, 'Error al obtener la simulación');
        }
    }

    /**
     * Elimina una simulación
     */
    async delete(id) {
        try {
            // Verificar que la simulación pertenece al usuario actual
            const simulacionExistente = await this.findById(id);
            const userId = this.getCurrentUserId();

            if (simulacionExistente.userId !== userId) {
                throw new Error('No tienes permiso para eliminar esta simulación');
            }

            await axios.delete(`${this.endpoint}/${id}`);
        } catch (error) {
            console.error('Error al eliminar simulación:', error);
            this.handleError(error, 'Error al eliminar la simulación');
        }
    }

    /**
     * Obtiene las entidades financieras disponibles
     */
    async getEntidadesFinancieras() {
        // Por ahora retornamos datos estáticos
        return [
            { value: 'bcp', label: 'Banco de Crédito del Perú' },
            { value: 'bbva', label: 'BBVA Continental' },
            { value: 'interbank', label: 'Interbank' },
            { value: 'scotiabank', label: 'Scotiabank' },
            { value: 'banbif', label: 'BanBif' },
            { value: 'pichincha', label: 'Banco Pichincha' },
            { value: 'mibanco', label: 'Mibanco' },
            { value: 'cajaArequipa', label: 'Caja Arequipa' },
            { value: 'cajaHuancayo', label: 'Caja Huancayo' },
            { value: 'cajaPiura', label: 'Caja Piura' }
        ];
    }

    /**
     * Obtiene los programas de vivienda disponibles
     */
    async getProgramasVivienda() {
        // Por ahora retornamos datos estáticos
        return [
            { value: 'techoPropio', label: 'Techo Propio' },
            { value: 'miVivienda', label: 'Nuevo Crédito MiVivienda' },
            { value: 'miViviendaVerde', label: 'MiVivienda Verde' },
            { value: 'convencional', label: 'Crédito Hipotecario Convencional' }
        ];
    }

    /**
     * Obtiene los costos adicionales de una entidad financiera
     * @param {string} entidadValue - El value de la entidad (ej: 'bcp', 'bbva')
     * @returns {Promise<Object>}
     */
    async getCostosEntidad(entidadValue) {
        try {
            // Datos basados en los promedios del CSV proporcionado
            // En producción, esto vendría de la base de datos
            const costosMap = {
                'bcp': {
                    seguroDesgravamen: 0.35,
                    tasacion: 160,
                    seguroInmueble: 0.0195,
                    gastosNotariales: 500,
                    comisionDesembolso: 0
                },
                'bbva': {
                    seguroDesgravamen: 0.47,
                    tasacion: 160,
                    seguroInmueble: 0.0252,
                    gastosNotariales: 500,
                    comisionDesembolso: 0
                },
                'interbank': {
                    seguroDesgravamen: 0.47,
                    tasacion: 160,
                    seguroInmueble: 0.0209,
                    gastosNotariales: 500,
                    comisionDesembolso: 0
                },
                'scotiabank': {
                    seguroDesgravamen: 0.29,
                    tasacion: 140,
                    seguroInmueble: 0.031,
                    gastosNotariales: 310,
                    comisionDesembolso: 3
                },
                'banbif': {
                    seguroDesgravamen: 0.11,
                    tasacion: 160,
                    seguroInmueble: 0.035,
                    gastosNotariales: 500,
                    comisionDesembolso: 5
                },
                'pichincha': {
                    seguroDesgravamen: 0.53,
                    tasacion: 160,
                    seguroInmueble: 0.0275,
                    gastosNotariales: 375,
                    comisionDesembolso: 0
                },
                'mibanco': {
                    seguroDesgravamen: 0.46,
                    tasacion: 160,
                    seguroInmueble: 0.0237,
                    gastosNotariales: 310,
                    comisionDesembolso: 6.4
                },
                'cajaArequipa': {
                    seguroDesgravamen: 0.07,
                    tasacion: 160,
                    seguroInmueble: 0.0253,
                    gastosNotariales: 310,
                    comisionDesembolso: 2.5
                },
                'cajaHuancayo': {
                    seguroDesgravamen: 0.14,
                    tasacion: 242.5,
                    seguroInmueble: 0.028,
                    gastosNotariales: 1250,
                    comisionDesembolso: 11
                },
                'cajaPiura': {
                    seguroDesgravamen: 0.04,
                    tasacion: 265,
                    seguroInmueble: 0.0255,
                    gastosNotariales: 310,
                    comisionDesembolso: 10
                }
            };

            return costosMap[entidadValue] || {
                seguroDesgravamen: 0,
                tasacion: 0,
                seguroInmueble: 0,
                gastosNotariales: 0,
                comisionDesembolso: 0
            };
        } catch (error) {
            console.error('Error al obtener costos de entidad:', error);
            return {
                seguroDesgravamen: 0,
                tasacion: 0,
                seguroInmueble: 0,
                gastosNotariales: 0,
                comisionDesembolso: 0
            };
        }
    }

    /**
     * Obtiene las tasas TEA de una entidad financiera según el programa
     * @param {string} entidadValue - El value de la entidad (ej: 'bcp', 'bbva')
     * @param {string} programa - El programa de vivienda ('techoPropio', 'miVivienda', etc.)
     * @returns {Promise<Object>}
     */
    async getTasasEntidad(entidadValue, programa = 'miVivienda') {
        try {
            // Datos basados en el CSV de tasas proporcionado
            // En producción, esto vendría de la base de datos
            const tasasMap = {
                'bcp': {
                    techoPropio: { min: 10.20, max: 12.00, promedio: 11.10 },
                    miVivienda: { min: 10.20, max: 13.99, promedio: 12.10 }
                },
                'bbva': {
                    techoPropio: { min: 12.51, max: 15.21, promedio: 13.86 },
                    miVivienda: { min: 12.51, max: 15.28, promedio: 13.90 }
                },
                'interbank': {
                    techoPropio: { min: 13.00, max: 16.00, promedio: 14.50 },
                    miVivienda: { min: 13.00, max: 16.00, promedio: 14.50 }
                },
                'scotiabank': {
                    techoPropio: { min: 9.99, max: 12.40, promedio: 11.20 },
                    miVivienda: { min: 9.99, max: 12.40, promedio: 11.20 }
                },
                'banbif': {
                    techoPropio: { min: 20.00, max: 20.00, promedio: 20.00 },
                    miVivienda: { min: 20.00, max: 20.00, promedio: 20.00 }
                },
                'pichincha': {
                    techoPropio: { min: 15.00, max: 16.50, promedio: 15.75 },
                    miVivienda: { min: 15.00, max: 16.50, promedio: 15.75 }
                },
                'mibanco': {
                    techoPropio: { min: 10.75, max: 15.80, promedio: 13.28 },
                    miVivienda: { min: 10.75, max: 15.80, promedio: 13.28 }
                },
                'cajaArequipa': {
                    techoPropio: { min: 13.99, max: 19.99, promedio: 16.99 },
                    miVivienda: { min: 13.99, max: 19.99, promedio: 16.99 }
                },
                'cajaHuancayo': {
                    techoPropio: { min: 11.22, max: 14.98, promedio: 13.10 },
                    miVivienda: { min: 11.22, max: 14.98, promedio: 13.10 }
                },
                'cajaPiura': {
                    techoPropio: { min: 13.75, max: 16.00, promedio: 14.88 },
                    miVivienda: { min: 11.50, max: 16.00, promedio: 13.75 }
                }
            };

            const entidadTasas = tasasMap[entidadValue];
            if (!entidadTasas) {
                return { min: 0, max: 0, promedio: 0 };
            }

            // Determinar qué tasas usar según el programa
            if (programa === 'techoPropio') {
                return entidadTasas.techoPropio;
            } else {
                // Para miVivienda, miViviendaVerde y convencional usar las tasas de NCMV
                return entidadTasas.miVivienda;
            }
        } catch (error) {
            console.error('Error al obtener tasas de entidad:', error);
            return { min: 0, max: 0, promedio: 0 };
        }
    }

    /**
     * Maneja los errores de las peticiones HTTP
     */
    handleError(error, defaultMessage) {
        if (error.message) {
            throw new Error(error.message);
        } else if (error.response) {
            const message = error.response.data?.message || defaultMessage;
            throw new Error(message);
        } else if (error.request) {
            throw new Error('No se pudo conectar con el servidor. Verifique su conexión.');
        } else {
            throw new Error(defaultMessage);
        }
    }
}