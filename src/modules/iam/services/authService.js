// src/modules/iam/infrastructure/services/authService.js

import { supabase } from '@/shared/infrastructure/supabase'

export class AuthService {

    /**
     * Iniciar sesión con email y password
     */
    static async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        return data; // contiene session + user
    }

    /**
     * Registrarse
     */
    static async signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) throw error;

        return data;
    }

    /**
     * Cerrar sesión
     */
    static async signOut() {
        await supabase.auth.signOut();
    }

    /**
     * Obtener sesión activa
     */
    static async getSession() {
        const { data } = await supabase.auth.getSession();
        return data.session;
    }

    /**
     * Obtener el usuario del Auth
     */
    static async getUser() {
        const { data } = await supabase.auth.getUser();
        return data.user;
    }
}
