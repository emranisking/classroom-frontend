<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { apiMessage } from '@/services/http'

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const toast = useToastStore()

async function onSubmit() {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = 'Enter your email and password.'
    return
  }
  loading.value = true
  try {
    const user = await auth.login(email.value, password.value)
    toast.success(`Welcome back, ${user.name.split(' ')[0]}.`)
    router.push(route.query.redirect || { name: 'dashboard' })
  } catch (e) {
    error.value = apiMessage(e, 'Could not sign in. Check your email and password.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-brand">
        <svg width="40" height="40" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#1e8e3e"/><path d="M14 24l7 7 13-13" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <h1>Classroom</h1>
      </div>
      <p class="auth-subtitle">Sign in to the Assignment Management System</p>

      <form @submit.prevent="onSubmit">
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" autocomplete="username" placeholder="you@example.com" />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input id="password" v-model="password" type="password" autocomplete="current-password" placeholder="••••••••" />
        </div>
        <p v-if="error" class="field-error">{{ error }}</p>
        <button class="btn btn-primary auth-submit" type="submit" :disabled="loading">
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <p class="auth-switch">
        New student? <router-link to="/register">Create an account</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(160deg, #f8f9fa 0%, #e8f0fe 100%);
  padding: 16px;
}
.auth-card {
  background: #fff; border-radius: 16px; box-shadow: var(--gc-shadow-lg);
  padding: 40px 36px; width: 100%; max-width: 400px;
}
.auth-brand { display: flex; align-items: center; gap: 12px; }
.auth-brand h1 { font-family: 'Google Sans', Roboto, sans-serif; font-size: 24px; margin: 0; color: var(--gc-text); }
.auth-subtitle { color: var(--gc-text-secondary); font-size: 14px; margin: 8px 0 28px; }
.auth-submit { width: 100%; padding: 12px; margin-top: 6px; font-size: 15px; }
.auth-switch { text-align: center; font-size: 14px; color: var(--gc-text-secondary); margin-top: 24px; }
.auth-switch a { color: var(--gc-blue); font-weight: 500; }
</style>
