<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import AppSidebar from './AppSidebar.vue';

// State
const isMobile = ref(false);
const sidebarVisible = ref(true);

// Methods
const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 768;
  if (isMobile.value) {
    sidebarVisible.value = false;
  } else {
    sidebarVisible.value = true;
  }
};

const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value;
};

// Lifecycle
onMounted(() => {
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize);
});
</script>

<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <AppSidebar v-if="sidebarVisible || !isMobile" />

    <!-- Main Content -->
    <main class="main-content" :class="{ 'main-content-full': !sidebarVisible && isMobile }">
      <!-- Mobile Menu Button -->
      <button
          v-if="isMobile"
          class="mobile-menu-btn"
          @click="toggleSidebar"
      >
        <i class="pi pi-bars"></i>
      </button>

      <!-- Content Area -->
      <div class="content-wrapper">
        <router-view />
      </div>
    </main>

    <!-- Overlay para mobile cuando sidebar está abierto -->
    <div
        v-if="isMobile && sidebarVisible"
        class="sidebar-overlay"
        @click="toggleSidebar"
    ></div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: #f3f4f6;
  position: relative;
}

.main-content {
  flex: 1;
  margin-left: 260px;
  min-height: 100vh;
  transition: margin-left 0.3s ease;
}

.main-content-full {
  margin-left: 0;
}

.content-wrapper {
  padding: 2rem;
  max-width: 100%;
}

.mobile-menu-btn {
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 999;
  width: 48px;
  height: 48px;
  background: #059669;
  color: white;
  border: none;
  border-radius: 8px;
  display: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.mobile-menu-btn:hover {
  background: #047857;
  transform: scale(1.05);
}

.mobile-menu-btn i {
  font-size: 1.25rem;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: none;
}

/* Responsive */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }

  .content-wrapper {
    padding: 1rem;
    padding-top: 5rem;
  }

  .mobile-menu-btn {
    display: flex;
  }

  .sidebar-overlay {
    display: block;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .content-wrapper {
    padding: 1.5rem;
  }
}
</style>
//XD
//Hello Jorge