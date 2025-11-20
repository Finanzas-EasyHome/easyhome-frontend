// src/modules/iam/domain/entities/User.js

/**
 * Entidad Usuario - Representa un usuario en el dominio
 */
export class User {
    constructor(data = {}) {
        this.id = data.id || null;
        this.email = data.email || '';
        this.username = data.username || '';
        this.firstName = data.firstName || '';
        this.lastName = data.lastName || '';
        this.role = data.role || 'user';
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.createdAt = data.created_at || null;
        this.updatedAt = data.updated_at || null;
    }

    static create(data) {
        return new User(data);
    }

    validateForRegister() {
        const errors = [];

        if (!this.email) errors.push('El correo electrónico es requerido');
        if (!this.username) errors.push('El usuario es requerido');
        if (!this.firstName) errors.push('El nombre es requerido');
        if (!this.lastName) errors.push('El apellido es requerido');

        return {
            valid: errors.length === 0,
            errors
        };
    }

    validateForLogin() {
        const errors = [];

        if (!this.email) errors.push('El correo electrónico es requerido');
        if (!this.password) errors.push('La contraseña es requerida');

        return {
            valid: errors.length === 0,
            errors
        };
    }

    toRegisterDTO() {
        return {
            email: this.email,
            username: this.username,
            firstName: this.firstName,
            lastName: this.lastName,
            role: this.role,
            isActive: this.isActive
        };
    }

    toLoginDTO() {
        return {
            email: this.email,
            password: this.password
        };
    }
}
