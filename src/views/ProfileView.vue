<script setup>
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
</script>

<template>
  <div class="profile-page">
    <h1 class="page-title">My profile</h1>
    <div class="card profile-card">
      <span class="avatar-xl">{{ auth.initials }}</span>
      <div class="profile-info">
        <div class="profile-name">{{ auth.user?.name }}</div>
        <div class="profile-email">{{ auth.user?.email }}</div>
        <span class="chip" style="background:#e8f0fe;color:#1a73e8;margin-top:8px;">{{ auth.role }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-title { font-family: 'Google Sans', Roboto, sans-serif; font-size: 26px; font-weight: 500; margin: 0 0 24px; }
.profile-card { max-width: 500px; padding: 28px; display: flex; align-items: center; gap: 20px; }
.avatar-xl { width: 72px; height: 72px; border-radius: 50%; background: var(--gc-blue); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 500; flex-shrink: 0; }
.profile-name { font-size: 18px; font-weight: 500; }
.profile-email { color: var(--gc-text-secondary); font-size: 14px; margin-top: 2px; }
</style>
