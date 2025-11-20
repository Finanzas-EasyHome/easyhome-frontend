<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useAuth } from '/src/modules/iam/services/useAuth.js';
import { supabase } from '/src/shared/infrastructure/supabase.js';


const router = useRouter();
const toast = useToast();
const { signIn, signUp, loading } = useAuth();

// State
const isLoginMode = ref(true);
const showPassword = ref(false);
const formData = ref({
  username: '',
  password: '',
  email: '',
  firstName: '',
  lastName: ''
});

// Computed
const buttonLabel = computed(() => isLoginMode.value ? 'Iniciar sesión' : 'Registrarme');
const toggleModeText = computed(() =>
    isLoginMode.value ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'
);

// Methods
const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value;
  resetForm();
};

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const resetForm = () => {
  formData.value = {
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: ''
  };
};

const handleSubmit = async () => {
  try {
    if (isLoginMode.value) {
      // LOGIN usando el useAuth (NO usar supabase directo)
      await signIn({
        username: formData.value.username,
        password: formData.value.password
      });

      toast.add({
        severity: 'success',
        summary: '¡Bienvenido!',
        detail: 'Sesión iniciada correctamente',
        life: 3000
      });

      router.push('/clientes');
    }

    else {
      // REGISTRO — con Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.value.email,
        password: formData.value.password,
      });

      if (error) throw new Error("No se pudo crear la cuenta");

      // Guardar perfil
      const { error: insertError } = await supabase.from('users').insert({
        id: data.user.id,
        email: formData.value.email,
        username: formData.value.username,
        role: 'user',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      if (insertError) throw new Error("No se pudo guardar el perfil");

      toast.add({
        severity: 'success',
        summary: '¡Registro exitoso!',
        detail: 'Tu cuenta ha sido creada correctamente',
        life: 3000
      });

      router.push('/clientes');
    }

  } catch (error) {

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Usuario o contraseña incorrectos',
      life: 3000
    });
  }
};


</script>

<template>
  <div class="login-container">
    <div class="login-background"></div>
    <div class="login-card">
      <!-- Logo -->
      <div class="logo-section">
        <img src="/src/assets/img/Easy-home-logo.png" alt="EasyHome Logo" class="logo-image">
      </div>

      <!-- Título -->
      <h1 class="welcome-title">Bienvenido</h1>
      <p class="welcome-subtitle">
        {{ isLoginMode ? 'Ingresa tus datos para acceder a tu cuenta' : 'Crea tu cuenta para comenzar' }}
      </p>

      <!-- Formulario -->
      <form @submit.prevent="handleSubmit" class="login-form">

        <!-- Campos de Registro -->
        <template v-if="!isLoginMode">
          <div class="form-group">
            <InputText
                v-model="formData.firstName"
                placeholder="Nombre"
                class="form-input"
                :disabled="loading"
                required
            />
          </div>

          <div class="form-group">
            <InputText
                v-model="formData.lastName"
                placeholder="Apellido"
                class="form-input"
                :disabled="loading"
                required
            />
          </div>

          <div class="form-group">
            <InputText
                v-model="formData.email"
                type="email"
                placeholder="Correo electrónico"
                class="form-input"
                :disabled="loading"
                required
            />
          </div>
        </template>

        <!-- Usuario -->
        <div class="form-group">
          <InputText
              v-model="formData.username"
              placeholder="Usuario"
              class="form-input w-10"
              :disabled="loading"
              required
          />
        </div>

        <!-- Contraseña -->
        <div class="form-group password-group align-items-center">
          <InputText
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Contraseña"
              class="form-input w-10"
              :disabled="loading"
              required
          />
          <Button
              :icon="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
              class="password-toggle p-10 m-2"
              type="button"
              text
              @click="togglePasswordVisibility"
              :disabled="loading"
          />
        </div>

        <!-- Olvidaste contraseña (solo en login) -->
        <div v-if="isLoginMode" class="forgot-password-section">
          <a href="#" class="forgot-password-link">¿Olvidaste tu contraseña?</a>
        </div>

        <!-- Botón Submit -->
        <Button
            type="submit"
            :label="buttonLabel"
            class="submit-button"
            :loading="loading"
            :disabled="loading"
        />

        <!-- Toggle Mode -->
        <div class="toggle-mode-section">
          <a @click="toggleMode" class="toggle-mode-link">
            {{ toggleModeText }}
          </a>
        </div>
      </form>
    </div>

    <Toast />
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}
.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg,
  rgba(3, 31, 64, 0.95) 0%,
  rgba(7, 101, 15, 0.95) 100%);
  z-index: 0;
}

.login-card {
  position: relative;
  z-index: 2;
  background: white;
  border-radius: 28px;
  padding: 2.5rem 2rem;
  max-width: 440px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-section {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.logo-image {
  width: 100px;
  height: 100px;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.welcome-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  text-align: center;
  margin-bottom: 0.5rem;
  letter-spacing: -0.025em;
}

.welcome-subtitle {
  font-size: 0.9375rem;
  color: #6b7280;
  text-align: center;
  margin-bottom: 1.75rem;
  line-height: 1.5;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  position: relative;
}

.password-group {
  display: flex;
  align-items: center;
}

.password-toggle {
  position: absolute;
  right: 0.5rem;
  color: #6b7280;
  padding: 0.5rem;
}

.password-toggle:hover {
  color: #059669;
}

.forgot-password-section {
  text-align: right;
  margin-top: -0.25rem;
  margin-bottom: 0.25rem;
}

.forgot-password-link {
  color: #059669;
  font-size: 0.875rem;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.forgot-password-link:hover {
  color: #047857;
  text-decoration: underline;
}

.submit-button {
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  margin-top: 0.5rem;
  transition: all 0.3s ease;
}

.submit-button:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(5, 150, 105, 0.3);
}

.toggle-mode-section {
  text-align: center;
  margin-top: 0.75rem;
}

.toggle-mode-link {
  color: #6b7280;
  font-size: 0.9375rem;
  cursor: pointer;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.toggle-mode-link:hover {
  color: #059669;
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 640px) {
  .login-container {
    padding: 1rem;
  }

  .login-card {
    padding: 2rem 1.5rem;
    max-width: 100%;
  }

  .welcome-title {
    font-size: 1.625rem;
  }

  .welcome-subtitle {
    font-size: 0.875rem;
  }

  .logo-image {
    width: 90px;
    height: 90px;
  }
}
</style>

<style>
/* Estilos globales para los inputs en el login */
.login-card .p-inputtext {
  border: 2px solid #e5e7eb !important;
  border-radius: 10px !important;
  padding: 0.75rem 1rem !important;
  font-size: 0.9375rem !important;
  transition: all 0.2s ease !important;
  background: #f9fafb !important;
  width: 100%;
}

.login-card .p-inputtext:hover {
  border-color: #d1d5db !important;
  background: white !important;
}

.login-card .p-inputtext:focus {
  border-color: #059669 !important;
  background: white !important;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1) !important;
  outline: none !important;
}

.login-card .p-inputtext::placeholder {
  color: #9ca3af;
  font-weight: 400;
}

.login-card .p-button {
  border-radius: 12px !important;
}

.login-card .p-button.p-button-text {
  background: transparent !important;
  border: none !important;
}
</style>