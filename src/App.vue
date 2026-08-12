<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import TopBar from '@/components/TopBar.vue'
import Sidebar from '@/components/Sidebar.vue'
import ToastHost from '@/components/ToastHost.vue'

const route = useRoute()
const showChrome = computed(() => !route.meta.hideChrome)
const sidebarOpen = ref(true)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <div v-if="showChrome" class="app-shell">
    <TopBar @toggle-sidebar="toggleSidebar" />
    <div class="app-body">
      <Sidebar :open="sidebarOpen" />
      <main class="app-main" :class="{ 'sidebar-collapsed': !sidebarOpen }">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" class="scroll-fade" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
  <router-view v-else />
  <ToastHost />
</template>

<style>
.app-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.app-body {
  display: flex;
  flex: 1;
  min-height: 0;
  margin-top: var(--topbar-h);
}
.app-main {
  flex: 1;
  margin-left: var(--sidebar-w);
  padding: 24px 32px 48px;
  transition: margin-left .2s ease;
  min-width: 0;
}
.app-main.sidebar-collapsed {
  margin-left: 72px;
}
.fade-enter-active, .fade-leave-active { transition: opacity .12s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 900px) {
  .app-main { margin-left: 0 !important; padding: 16px; }
}
</style>
