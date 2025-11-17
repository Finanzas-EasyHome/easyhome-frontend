// src/modules/iam/infrastructure/repositories/AuthRepositoryImpl.js

import axios from 'axios';
import { AuthRepository } from '/src/modules/iam/services/AuthRepository.js';

export class AuthRepositoryImpl extends AuthRepository {
    constructor() {
        super();
        this.baseUrl = import.meta.env.VITE_API_BASE_URL;
        this.authEndpoint = `${this.baseUrl}/auth`;
        this.usersEndpoint = `${this.baseUrl}/users`;
    }

    /**
     * Registra un nuevo usuario
     * @param {Object} userData - Datos del usuario
     * @returns {Promise<Object>}
     */
    async register(userData) {
        try {
            // Verificar si el usuario ya existe
            const existingUsers = await axios.get(this.usersEndpoint, {
                params: {
                    username: userData.username
                }
            });

            if (existingUsers.data.length > 0) {
                throw new Error('El nombre de usuario ya está en uso');
            }

            // Verificar si el email ya existe
            const existingEmails = await axios.get(this.usersEndpoint, {
                params: {
                    email: userData.email
                }
            });

            if (existingEmails.data.length > 0) {
                throw new Error('El correo electrónico ya está en uso');
            }

            // Crear el usuario (en producción, el password debería ser hasheado en el backend)
            const newUser = {
                ...userData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const response = await axios.post(this.usersEndpoint, newUser);

            // Simular generación de token
            const token = this.generateToken(response.data);

            return {
                user: this.sanitizeUser(response.data),
                token
            };
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            this.handleError(error, 'Error al registrar el usuario');
        }
    }

    /**
     * Inicia sesión
     * @param {Object} credentials - Credenciales del usuario
     * @returns {Promise<Object>}
     */
    async login(credentials) {
        try {
            // Buscar usuario por username
            const response = await axios.get(this.usersEndpoint, {
                params: {
                    username: credentials.username
                }
            });

            const users = response.data;

            if (users.length === 0) {
                throw new Error('Usuario o contraseña incorrectos');
            }

            const user = users[0];

            // Verificar contraseña (en producción esto se haría en el backend con hash)
            if (user.password !== credentials.password) {
                throw new Error('Usuario o contraseña incorrectos');
            }

            // Verificar si el usuario está activo
            if (!user.isActive) {
                throw new Error('Usuario inactivo. Contacte al administrador.');
            }

            // Generar token
            const token = this.generateToken(user);

            return {
                user: this.sanitizeUser(user),
                token
            };
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            this.handleError(error, 'Error al iniciar sesión');
        }
    }

    /**
     * Cierra sesión
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            // Limpiar token del localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return Promise.resolve();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            throw error;
        }
    }

    /**
     * Verifica el token de autenticación
     * @param {string} token - Token de autenticación
     * @returns {Promise<Object>}
     */
    async verifyToken(token) {
        try {
            // Decodificar el token (simulado)
            const payload = this.decodeToken(token);

            if (!payload || !payload.userId) {
                throw new Error('Token inválido');
            }

            // Verificar expiración
            if (payload.exp && payload.exp < Date.now()) {
                throw new Error('Token expirado');
            }

            // Obtener usuario actualizado
            const response = await axios.get(`${this.usersEndpoint}/${payload.userId}`);

            return {
                valid: true,
                user: this.sanitizeUser(response.data)
            };
        } catch (error) {
            console.error('Error al verificar token:', error);
            return {
                valid: false,
                user: null
            };
        }
    }

    /**
     * Obtiene el perfil del usuario actual
     * @returns {Promise<Object>}
     */
    async getProfile() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No hay sesión activa');
            }

            const payload = this.decodeToken(token);
            const response = await axios.get(`${this.usersEndpoint}/${payload.userId}`);

            return this.sanitizeUser(response.data);
        } catch (error) {
            console.error('Error al obtener perfil:', error);
            this.handleError(error, 'Error al obtener el perfil');
        }
    }

    /**
     * Actualiza el perfil del usuario
     * @param {Object} userData - Datos a actualizar
     * @returns {Promise<Object>}
     */
    async updateProfile(userData) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No hay sesión activa');
            }

            const payload = this.decodeToken(token);

            const updatedData = {
                ...userData,
                updatedAt: new Date().toISOString()
            };

            const response = await axios.patch(
                `${this.usersEndpoint}/${payload.userId}`,
                updatedData
            );

            return this.sanitizeUser(response.data);
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            this.handleError(error, 'Error al actualizar el perfil');
        }
    }

    /**
     * Genera un token JWT simulado (en producción esto se hace en el backend)
     * @private
     */
    generateToken(user) {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            userId: user.id,
            username: user.username,
            role: user.role,
            exp: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
        }));
        const signature = btoa('simulated-signature');

        return `${header}.${payload}.${signature}`;
    }

    /**
     * Decodifica un token JWT simulado
     * @private
     */
    decodeToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                return null;
            }
            return JSON.parse(atob(parts[1]));
        } catch (error) {
            return null;
        }
    }

    /**
     * Elimina datos sensibles del usuario
     * @private
     */
    sanitizeUser(user) {
        const { password, ...sanitized } = user;
        return sanitized;
    }

    /**
     * Maneja los errores de las peticiones HTTP
     * @private
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