// src/modules/clientes/domain/entities/Cliente.js

/**
 * Entidad Cliente - Representa un cliente en el dominio
 */
export class Cliente {
    constructor(data = {}) {
        this.id = data.id || null;
        this.nombresApellidos = data.nombresApellidos || '';
        this.dni = data.dni || '';
        this.edad = data.edad || null;
        this.ingresoFamiliar = data.ingresoFamiliar || 0;
        this.aporte = data.aporte || 0;
        this.estadoCivil = data.estadoCivil || '';
        this.tieneDiscapacidad = data.tieneDiscapacidad || false;
        this.esMigranteRetornado = data.esMigranteRetornado || false;
        this.esPersonaDesplazada = data.esPersonaDesplazada || false;

        // Datos de la vivienda
        this.vivienda = data.vivienda || {
            proyecto: '',
            tipoVivienda: '',
            valorVivienda: 0,
            esViviendaSostenible: false,
            cuotaInicial: 0,
            cuotaInicialPorcentaje: 0,
            bonoBienPagador: '',
            tipoBBP: '',
            ubicacion: ''
        };

        this.createdAt = data.createdAt || null;
        this.updatedAt = data.updatedAt || null;
    }

    /**
     * Crea una nueva instancia de Cliente
     * @param {Object} data - Datos del cliente
     * @returns {Cliente}
     */
    static create(data) {
        return new Cliente(data);
    }

    /**
     * Valida los datos del cliente
     * @returns {Object} { valid: boolean, errors: string[] }
     */
    validate() {
        const errors = [];

        // Validar nombres y apellidos
        if (!this.nombresApellidos || this.nombresApellidos.trim().length === 0) {
            errors.push('El nombre y apellidos es requerido');
        } else if (this.nombresApellidos.trim().length < 3) {
            errors.push('El nombre y apellidos debe tener al menos 3 caracteres');
        }

        // Validar DNI
        if (!this.dni) {
            errors.push('El DNI es requerido');
        } else if (this.dni.length !== 8) {
            errors.push('El DNI debe tener exactamente 8 dígitos');
        } else if (!/^\d+$/.test(this.dni)) {
            errors.push('El DNI solo debe contener números');
        }

        // Validar edad
        if (this.edad === null || this.edad === undefined) {
            errors.push('La edad es requerida');
        } else if (this.edad < 18) {
            errors.push('Debe ser mayor de edad (18 años o más)');
        } else if (this.edad > 100) {
            errors.push('La edad debe ser menor o igual a 100 años');
        }

        // Validar ingreso familiar
        if (this.ingresoFamiliar === null || this.ingresoFamiliar === undefined) {
            errors.push('El ingreso familiar es requerido');
        } else if (this.ingresoFamiliar < 0) {
            errors.push('El ingreso familiar debe ser mayor o igual a 0');
        }

        // Validar aporte
        if (this.aporte === null || this.aporte === undefined) {
            errors.push('El aporte es requerido');
        } else if (this.aporte < 0) {
            errors.push('El aporte debe ser mayor o igual a 0');
        }

        // Validar estado civil
        if (!this.estadoCivil || this.estadoCivil.trim().length === 0) {
            errors.push('El estado civil es requerido');
        }

        // Validar datos de vivienda
        if (!this.vivienda.proyecto || this.vivienda.proyecto.trim().length === 0) {
            errors.push('El proyecto/nombre de la vivienda es requerido');
        }

        if (!this.vivienda.tipoVivienda || this.vivienda.tipoVivienda.trim().length === 0) {
            errors.push('El tipo de vivienda es requerido');
        }

        if (this.vivienda.valorVivienda === null || this.vivienda.valorVivienda === undefined || this.vivienda.valorVivienda <= 0) {
            errors.push('El valor de la vivienda debe ser mayor a 0');
        }

        if (this.vivienda.cuotaInicial === null || this.vivienda.cuotaInicial === undefined || this.vivienda.cuotaInicial < 0) {
            errors.push('La cuota inicial debe ser mayor o igual a 0');
        }

        if (!this.vivienda.tipoBBP || this.vivienda.tipoBBP.trim().length === 0) {
            errors.push('El tipo de BBP es requerido');
        }

        if (!this.vivienda.ubicacion || this.vivienda.ubicacion.trim().length === 0) {
            errors.push('La ubicación es requerida');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Convierte la entidad a un objeto plano
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            nombresApellidos: this.nombresApellidos,
            dni: this.dni,
            edad: this.edad,
            ingresoFamiliar: this.ingresoFamiliar,
            aporte: this.aporte,
            estadoCivil: this.estadoCivil,
            tieneDiscapacidad: this.tieneDiscapacidad,
            esMigranteRetornado: this.esMigranteRetornado,
            esPersonaDesplazada: this.esPersonaDesplazada,
            vivienda: { ...this.vivienda },
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Convierte la entidad a un objeto para enviar a la API (sin id)
     * @returns {Object}
     */
    toCreateDTO() {
        return {
            nombresApellidos: this.nombresApellidos,
            dni: this.dni,
            edad: this.edad,
            ingresoFamiliar: this.ingresoFamiliar,
            aporte: this.aporte,
            estadoCivil: this.estadoCivil,
            tieneDiscapacidad: this.tieneDiscapacidad,
            esMigranteRetornado: this.esMigranteRetornado,
            esPersonaDesplazada: this.esPersonaDesplazada,
            vivienda: { ...this.vivienda }
        };
    }

    /**
     * Convierte la entidad a un objeto para actualizar en la API
     * @returns {Object}
     */
    toUpdateDTO() {
        return {
            nomblesApellidos: this.nombresApellidos,
            dni: this.dni,
            edad: this.edad,
            ingresoFamiliar: this.ingresoFamiliar,
            aporte: this.aporte,
            estadoCivil: this.estadoCivil,
            tieneDiscapacidad: this.tieneDiscapacidad,
            esMigranteRetornado: this.esMigranteRetornado,
            esPersonaDesplazada: this.esPersonaDesplazada,
            vivienda: { ...this.vivienda }
        };
    }

    /**
     * Clona la entidad
     * @returns {Cliente}
     */
    clone() {
        return new Cliente(this.toJSON());
    }
}