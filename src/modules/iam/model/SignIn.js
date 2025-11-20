// src/modules/iam/application/use-cases/SignIn.js

import { User } from '/src/modules/iam/domain/entities/User.js';

/**
 * Caso de uso: Iniciar sesión (Sign In)
 */
export class SignIn {
    constructor(repository) {
        this.repository = repository;
    }

    /**
     * Ejecuta el caso de uso
     * @param {Object} credentials - Credenciales del usuario
     * @returns {Promise<Object>}
     */
    async execute(credentials) {
        try {
            // Validación de dominio (NO SE TOCA)
            const user = User.create(credentials);
            const validation = user.validateForLogin();

            if (!validation.valid) {
                throw new Error(validation.errors.join(', '));
            }

            const result = await this.repository.login(user.toLoginDTO());

            if (result.token) {
                localStorage.setItem('token', result.token);
            }

            if (result.user) {
                localStorage.setItem('user', JSON.stringify(result.user));
            }

            return result;

        } catch (error) {
            console.error('Error en SignIn:', error);
            throw error;
        }
    }
}
