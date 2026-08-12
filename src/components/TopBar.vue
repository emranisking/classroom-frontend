<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits(['toggle-sidebar'])
const auth = useAuthStore()
const router = useRouter()
const menuOpen = ref(false)

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="topbar">
    <div class="topbar-left">
      <button class="icon-btn" @click="emit('toggle-sidebar')" aria-label="Menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="#5f6368" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
      <div class="brand">
        <svg width="28" height="28" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#1e8e3e"/><path d="M14 24l7 7 13-13" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span class="brand-name">Classroom</span>
      </div>
    </div>
    <div class="topbar-right">
      <button class="avatar-btn" @click="menuOpen = !menuOpen">
        <span class="avatar">{{ auth.initials }}</span>
      </button>
      <transition name="pop">
        <div v-if="menuOpen" class="user-menu" @click.self="menuOpen=false">
          <div class="user-menu-card">
            <div class="user-menu-header">
              <span class="avatar avatar-lg">{{ auth.initials }}</span>
              <div class="user-name">{{ auth.user?.name }}</div>
              <div class="user-email">{{ auth.user?.email }}</div>
              <span class="chip" :class="`chip-${auth.role?.toLowerCase()}`" style="margin-top:8px;background:#e8f0fe;color:#1a73e8;">{{ auth.role }}</span>
            </div>
            <div class="user-menu-actions">
              <router-link to="/profile" class="menu-item" @click="menuOpen=false">My profile</router-link>
              <button class="menu-item" @click="logout">Sign out</button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: var(--topbar-h);
  background: var(--gc-surface);
  border-bottom: 1px solid var(--gc-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 100;
}
.topbar-left { display: flex; align-items: center; gap: 8px; }
.icon-btn {
  background: none; border: none; border-radius: 50%;
  width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
}
.icon-btn:hover { background: var(--gc-hover); }
.brand { display: flex; align-items: center; gap: 10px; margin-left: 4px; }
.brand-name { font-family: 'Google Sans', Roboto, sans-serif; font-size: 22px; color: var(--gc-text-secondary); }
.topbar-right { display: flex; align-items: center; gap: 8px; position: relative; }
.avatar-btn { background: none; border: none; padding: 0; border-radius: 50%; }
.avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--gc-blue); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 500;
}
.avatar-lg { width: 56px; height: 56px; font-size: 20px; }
.user-menu {
  position: fixed; inset: 0; z-index: 200;
}
.user-menu-card {
  position: absolute; top: 56px; right: 16px;
  background: #fff; border-radius: 12px; box-shadow: var(--gc-shadow-lg);
  width: 280px; overflow: hidden;
}
.user-menu-header {
  display: flex; flex-direction: column; align-items: center;
  padding: 24px 16px; gap: 4px; border-bottom: 1px solid var(--gc-border);
}
.user-name { font-weight: 500; margin-top: 8px; }
.user-email { color: var(--gc-text-secondary); font-size: 13px; }
.user-menu-actions { padding: 8px; }
.menu-item {
  display: block; width: 100%; text-align: left;
  padding: 10px 12px; border-radius: 6px; border: none; background: none;
  font-size: 14px; color: var(--gc-text);
}
.menu-item:hover { background: var(--gc-hover); }
.pop-enter-active, .pop-leave-active { transition: opacity .12s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; }
</style>
