<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '/src/modules/iam/services/useAuth.js';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const route = useRoute();
const toast = useToast();

// Auth
const { signOut, user, isAuthenticated } = useAuth();

// Menu Items
const menuItems = ref([
  {
    label: 'Gestión de Clientes',
    icon: 'pi pi-users',
    route: '/clientes'
  },
  {
    label: 'Gestión de Clientes - NCMV',
    icon: 'pi pi-building',
    route: '/clientes-NCMV'
  },
  {
    label: 'Simulador de Financiamiento',
    icon: 'pi pi-calculator',
    route: '/simulador'
  },
  {
    label: 'Historial de Simulaciones',
    icon: 'pi pi-history',
    route: '/historial'
  }
]);

// Computed
const userName = computed(() => {
  if (user.value) {
    // Prioridad: firstName > username
    if (user.value.firstName && user.value.lastName) {
      return `${user.value.firstName} ${user.value.lastName}`;
    }
    return user.value.username || 'Usuario';
  }
  return 'Usuario';
});

const userRole = computed(() => {
  if (user.value) {
    return user.value.role === 'admin' ? 'Administrador' : 'Usuario';
  }
  return '';
});

// Methods
const isActiveRoute = (itemRoute) => {
  return route.path.startsWith(itemRoute);
};

const navigateTo = (itemRoute) => {
  router.push(itemRoute);
};

const handleLogout = async () => {
  try {
    await signOut();

    toast.add({
      severity: 'success',
      summary: 'Sesión cerrada',
      detail: 'Has cerrado sesión correctamente',
      life: 3000
    });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al cerrar sesión',
      life: 3000
    });
  }
};

// Cargar datos del usuario al montar
onMounted(() => {
  loadUserData();
});

// Recargar cuando cambie la autenticación
watch(() => isAuthenticated.value, (newVal) => {
  if (newVal) {
    loadUserData();
  }
});

const loadUserData = () => {
  if (!user.value) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Actualizar el valor del usuario en el composable
        user.value = parsedUser;
      } catch (e) {
        console.error('Error al cargar usuario:', e);
      }
    }
  }
};
</script>

<template>
  <div class="sidebar">
    <!-- Header -->
    <div class="sidebar-header">
      <span class="sidebar-label">ADMINISTRAR</span>

      <!-- Logo -->
      <div class="logo-container">
        <div class="logo-icon">
          <img src="/src/assets/img/Easy-home-logo.png" alt="EasyHome">
        </div>
      </div>
    </div>

    <!-- User Info -->
    <div class="user-info">
      <div class="user-avatar">
        <i class="pi pi-user"></i>
      </div>
      <div class="user-details">
        <span class="user-name">{{ userName }}</span>
        <span class="user-role" v-if="user">{{ userRole }}</span>
      </div>
    </div>

    <!-- Navigation Menu -->
    <nav class="sidebar-nav">
      <div
          v-for="(item, index) in menuItems"
          :key="index"
          class="nav-item"
          :class="{ 'nav-item-active': isActiveRoute(item.route) }"
          @click="navigateTo(item.route)"
      >
        <i :class="item.icon" class="nav-icon"></i>
        <span class="nav-label">{{ item.label }}</span>
      </div>
    </nav>

    <!-- Footer - Logout -->
    <div class="sidebar-footer">
      <div class="nav-item logout-item" @click="handleLogout">
        <i class="pi pi-sign-out nav-icon"></i>
        <span class="nav-label">Cerrar sesión</span>
      </div>
    </div>

    <!-- Toast -->
    <Toast />
  </div>
</template>

<style scoped>
.sidebar {
  width: 260px;
  height: 100vh;
  background: linear-gradient(180deg, #031f40 0%, #07650f 100%);
  display: flex;
  flex-direction: column;
  color: white;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  overflow-y: auto;
}

/* Header */
.sidebar-header {
  padding: 1.5rem;
}

.sidebar-label {
  display: block;
  font-size: 0.75rem;
  color: #86efac;
  letter-spacing: 0.1em;
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.875rem;
}

.logo-icon {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3),
  0 0 20px rgba(0, 0, 0, 0.2),
  0 0 30px rgba(0, 0, 0, 0.1);
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* User Info */
.user-info {
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.user-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-avatar i {
  font-size: 1.25rem;
  color: white;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow: hidden;
  flex: 1;
}

.user-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.user-role {
  font-size: 0.75rem;
  color: #86efac;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: 1rem 0.75rem;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-item-active {
  background: white;
  color: #059669;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.nav-icon {
  font-size: 1.125rem;
  flex-shrink: 0;
}

.nav-label {
  font-size: 0.875rem;
  line-height: 1.2;
}

/* Footer */
.sidebar-footer {
  padding: 1rem 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.logout-item {
  color: white;
}

.logout-item:hover {
  background: rgba(239, 68, 68, 0.2);
}

/* Scrollbar */
.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

.sidebar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
  }
}
</style>