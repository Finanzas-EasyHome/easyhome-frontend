// src/modules/clientes/domain/entities/Cliente.js

/**
 * Entidad Cliente - Representa un cliente en el dominio
 */
export class ClienteMV {
    constructor(data = {}) {
        this.id = data.id || null;
        this.nombresApellidos = data.nombresApellidos || '';
        this.dni = data.dni || '';
        this.edad = data.edad || null;
        this.ingresoFamiliar = data.ingresoFamiliar || 0;

        // Aporte se calcula según vivienda
        this.aporte = data.aporte || 0;

        this.estadoCivil = data.estadoCivil || '';
        this.tieneDiscapacidad = data.tieneDiscapacidad ?? false;
        this.esMigranteRetornado = data.esMigranteRetornado ?? false;
        this.esPersonaDesplazada = data.esPersonaDesplazada ?? false;

        // Datos de Vivienda
        this.vivienda = data.vivienda || {
            proyecto: '',
            tipoVivienda: '',
            valorVivienda: 0,
            viviendaSostenible: 0,
            bonoBbp: 0,
            cuotaInicial: 0,
            cuotaInicialPorcentaje: 0,
            tipoBBP: '',
            ubicacion: ''
        };

        // ===============================
        //  SINCRONIZAR CUOTA ↔ PORCENTAJE
        // ===============================
        const valor = Number(this.vivienda.valorVivienda) || 0;
        const cuota = Number(this.vivienda.cuotaInicial) || 0;
        const porcentaje = Number(this.vivienda.cuotaInicialPorcentaje) || 0;

        // Si hay cuotaInicial, calcular porcentaje
        if (valor > 0 && cuota > 0) {
            this.vivienda.cuotaInicialPorcentaje = Number(((cuota * 100) / valor).toFixed(2));
        }

// Si hay porcentaje, calcular cuotaInicial
        if (valor > 0 && porcentaje > 0) {
            this.vivienda.cuotaInicial = Number((valor * (porcentaje / 100)).toFixed(2));
        }

        // Calcular aporte final
        this.aporte = Number(this.vivienda.cuotaInicial);

        this.createdAt = data.createdAt || null;
        this.updatedAt = data.updatedAt || null;
    }

    static create(data) {
        return new ClienteMV(data);
    }

    // ============================
    // VALIDACIONES
    // ============================
    validate() {
        const errors = [];

        if (!this.nombresApellidos.trim()) {
            errors.push('El nombre y apellidos es requerido');
        }

        if (!this.dni || this.dni.length !== 8) {
            errors.push('El DNI debe tener 8 dígitos');
        }

        if (this.edad === null || this.edad < 18) {
            errors.push('Debe ser mayor de edad (18+ años)');
        }

        if (this.ingresoFamiliar <= 0) {
            errors.push('El ingreso familiar debe ser mayor a 0');
        }

        if (!this.estadoCivil.trim()) {
            errors.push('El estado civil es requerido');
        }

        // Vivienda
        if (!this.vivienda.proyecto.trim()) errors.push('El proyecto es requerido');
        if (!this.vivienda.tipoVivienda.trim()) errors.push('El tipo de vivienda es requerido');
        if (this.vivienda.valorVivienda <= 0) errors.push('El valor de la vivienda debe ser mayor a 0');
        if (!this.vivienda.viviendaSostenible.trim()) errors.push('La vivienda sostenible es requerido');
        if(!this.vivienda.bonoBbp.trim())errors.push('El bonoBbp es requerido');
        if (!this.vivienda.tipoBBP.trim()) errors.push('El tipo de VIS es requerido');
        if (!this.vivienda.ubicacion.trim()) errors.push('La ubicación es requerida');

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // ============================
    // DTO PARA CREAR
    // ============================
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

            vivienda: {
                proyecto: this.vivienda.proyecto,
                tipoVivienda: this.vivienda.tipoVivienda,
                valorVivienda: this.vivienda.valorVivienda,
                viviendaSostenible: this.vivienda.viviendaSostenible,
                bonoBbp: this.vivienda.bonoBbp,
                cuotaInicial: this.vivienda.cuotaInicial,
                cuotaInicialPorcentaje: this.vivienda.cuotaInicialPorcentaje,
                tipoBBP: this.vivienda.tipoBBP,
                ubicacion: this.vivienda.ubicacion
            }
        };
    }


    toUpdateDTO() {
        return this.toCreateDTO(); // mismos campos
    }
}
