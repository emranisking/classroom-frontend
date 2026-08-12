<script setup>
defineProps({
  title: { type: String, default: 'Nothing here yet' },
  message: { type: String, default: '' }
})
</script>

<template>
  <div class="empty-state">
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="56" fill="#f1f3f4"/>
      <path d="M40 74V46a4 4 0 0 1 4-4h32a4 4 0 0 1 4 4v28" stroke="#c4c7c5" stroke-width="3" stroke-linecap="round"/>
      <path d="M34 74h52a2 2 0 0 1 2 2v2a4 4 0 0 1-4 4H36a4 4 0 0 1-4-4v-2a2 2 0 0 1 2-2Z" fill="#dadce0"/>
      <path d="M48 54h24M48 62h16" stroke="#c4c7c5" stroke-width="3" stroke-linecap="round"/>
    </svg>
    <h3>{{ title }}</h3>
    <p v-if="message">{{ message }}</p>
    <slot />
  </div>
</template>
