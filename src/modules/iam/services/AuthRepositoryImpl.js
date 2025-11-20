// src/modules/iam/infrastructure/repositories/AuthRepositoryImpl.js

import { supabase } from '/src/shared/infrastructure/supabase.js';
import { AuthRepository } from '/src/modules/iam/services/AuthRepository.js';

export class AuthRepositoryImpl extends AuthRepository {


    async register(userData) {
        try {
            // 1. Crear usuario en Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: userData.email,
                password: userData.password
            });

            if (authError) throw new Error(authError.message);

            const userId = authData.user.id;

            // 2. Crear usuario en tabla personalizada
            const { error: insertError } = await supabase
                .from('users')
                .insert({
                    id: userId,
                    username: userData.username,
                    email: userData.email,
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    role: 'user',
                    is_active: true
                });

            if (insertError) throw new Error(insertError.message);

            return {
                user: {
                    id: userId,
                    email: userData.email,
                    username: userData.username,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    role: 'user'
                },
                token: null // Supabase maneja tokens automáticamente
            };

        } catch (error) {
            console.error('Supabase register error:', error);
            throw new Error(error.message || 'Error al registrar usuario');
        }
    }


    async login(credentials) {
        try {
            // 1. Buscar email por username
            const { data: users, error: userError } = await supabase
                .from("users")
                .select("email")
                .eq("username", credentials.username)
                .limit(1);

            if (userError) throw userError;

            if (!users || users.length === 0) {
                throw new Error("Usuario o contraseña incorrectos");
            }

            const email = users[0].email;

            // 2. Iniciar sesión con el email encontrado
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: email,
                password: credentials.password,
            });

            if (signInError) {
                throw new Error("Usuario o contraseña incorrectos");
            }

            // 3. Obtener perfil del usuario desde tu tabla users
            const { data: profile, error: profileError } = await supabase
                .from("users")
                .select("*")
                .eq("email", email)
                .limit(1)
                .single();

            if (profileError) throw profileError;

            // 4. Devolver usuario + token
            return {
                user: profile,
                token: data.session.access_token
            };

        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            throw error;
        }
    }

    async logout() {
        await supabase.auth.signOut();
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }


    async getProfile() {
        const user = supabase.auth.getUser();
        if (!user) throw new Error('No hay sesión activa');

        const userId = (await supabase.auth.getUser()).data.user.id;

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw new Error(error.message);

        return data;
    }

    // -------------------------
    // ⭐ ACTUALIZAR PERFIL
    // -------------------------
    async updateProfile(userData) {
        const userId = (await supabase.auth.getUser()).data.user.id;

        const { data, error } = await supabase
            .from('users')
            .update({
                username: userData.username,
                first_name: userData.firstName,
                last_name: userData.lastName,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw new Error(error.message);

        localStorage.setItem('user', JSON.stringify(data));

        return data;
    }
}
