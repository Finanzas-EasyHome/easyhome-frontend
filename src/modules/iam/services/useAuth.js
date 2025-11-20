// src/modules/iam/presentation/composables/useAuth.js

import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { AuthRepositoryImpl } from '/src/modules/iam/services/AuthRepositoryImpl.js';
import { SignIn } from '../model/SignIn.js';
import { SignUp } from '../model/SignUp.js';
import { SignOut } from '../model/SignOut.js';
import { supabase } from "/src/shared/infrastructure/supabase.js";

/**
 * Composable para manejar la lógica de autenticación
 */
export const useAuth = () => {
    const router = useRouter();

    // State
    const user = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const isAuthenticated = ref(false);

    // Repository & Use Cases
    const repository = new AuthRepositoryImpl();
    const signInUseCase = new SignIn(repository);
    const signUpUseCase = new SignUp(repository);
    const signOutUseCase = new SignOut(repository);

    // Computed
    const currentUser = computed(() => user.value);
    const isAdmin = computed(() => user.value?.role === 'admin');

    const initAuth = async () => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            try {
                const result = await repository.verifyToken(token);
                if (result.valid) {
                    user.value = result.user;
                    isAuthenticated.value = true;
                } else {
                    await signOutUseCase.execute();
                    isAuthenticated.value = false;
                    user.value = null;
                }
            } catch (e) {
                console.error('Error al verificar token:', e);
                await signOutUseCase.execute();
                isAuthenticated.value = false;
                user.value = null;
            }
        }
    };

    const signIn = async ({ username, password }) => {
        loading.value = true;
        error.value = null;

        try {
            // 1️⃣ Buscar email por username
            const { data: userProfile, error: userError } = await supabase
                .from("users")
                .select("email")
                .eq("username", username)
                .maybeSingle();

            if (!userProfile) {
                throw new Error("Usuario o contraseña incorrectos");
            }

            // 2️⃣ Autenticar en supabase
            const { data, error: loginError } = await supabase.auth.signInWithPassword({
                email: userProfile.email,
                password
            });

            if (loginError) throw new Error("Usuario o contraseña incorrectos");

            // 3️⃣ Obtener el perfil completo
            const { data: profile } = await supabase
                .from("users")
                .select("*")
                .eq("email", userProfile.email)
                .maybeSingle();

            user.value = profile;
            isAuthenticated.value = true;

            localStorage.setItem("user", JSON.stringify(profile));
            localStorage.setItem("token", data.session.access_token);

            return { user: profile };

        } catch (e) {
            error.value = e.message;
            console.error("LOGIN ERROR:", e);
            throw e;
        } finally {
            loading.value = false;
        }
    };

    const signUp = async (userData) => {
        loading.value = true;
        error.value = null;
        try {
            const result = await signUpUseCase.execute(userData);
            user.value = result.user;
            isAuthenticated.value = true;
            return result;
        } catch (e) {
            error.value = e.message || 'Error al registrar usuario';
            console.error('Error en signUp:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    };

    const signOut = async () => {
        try {
            loading.value = true;
            error.value = null;

            await signOutUseCase.execute();

            user.value = null;
            isAuthenticated.value = false;

            await router.push('/login');

            return Promise.resolve();
        } catch (e) {
            error.value = e.message || 'Error al cerrar sesión';
            console.error('Error en signOut:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    };

    const getProfile = async () => {
        loading.value = true;
        error.value = null;
        try {
            const profile = await repository.getProfile();
            user.value = profile;
            localStorage.setItem('user', JSON.stringify(profile));
            return profile;
        } catch (e) {
            error.value = e.message || 'Error al obtener perfil';
            console.error('Error al obtener perfil:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    };

    const updateProfile = async (userData) => {
        loading.value = true;
        error.value = null;
        try {
            const updatedUser = await repository.updateProfile(userData);
            user.value = updatedUser;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
        } catch (e) {
            error.value = e.message || 'Error al actualizar perfil';
            console.error('Error al actualizar perfil:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    };

    const clearError = () => {
        error.value = null;
    };

    return {
        user: currentUser,
        loading,
        error,
        isAuthenticated,
        isAdmin,

        initAuth,
        signIn,
        signUp,
        signOut,
        getProfile,
        updateProfile,
        clearError
    };
};
