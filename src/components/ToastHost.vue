<script setup>
import { useToastStore } from '@/stores/toast'
const toast = useToastStore()
</script>

<template>
  <div class="toast-wrap">
    <transition-group name="toast">
      <div v-for="t in toast.toasts" :key="t.id" class="toast" :class="t.type">
        {{ t.message }}
      </div>
    </transition-group>
  </div>
</template>
