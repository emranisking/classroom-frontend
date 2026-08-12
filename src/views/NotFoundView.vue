<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="notfound">
    <h1>404</h1>
    <p>This page doesn't exist.</p>
    <button class="btn btn-primary" @click="router.push('/')">Go to classes</button>
  </div>
</template>

<style scoped>
.notfound {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 100px 20px; text-align: center;
}
.notfound h1 { font-size: 64px; margin: 0; color: var(--gc-border); font-family: 'Google Sans', Roboto, sans-serif; }
.notfound p { color: var(--gc-text-secondary); margin: 8px 0 20px; }
</style>
