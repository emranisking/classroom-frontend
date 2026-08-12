<script setup>
defineProps({
  title: { type: String, default: '' },
  width: { type: String, default: '480px' }
})
const emit = defineEmits(['close'])
</script>

<template>
  <teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')">
      <div class="modal-panel" :style="{ maxWidth: width }">
        <div class="modal-header">
          <h2>{{ title }}</h2>
          <button class="icon-btn" @click="emit('close')" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="#5f6368" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <slot />
        </div>
        <div class="modal-footer" v-if="$slots.footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(32,33,36,.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 16px;
}
.modal-panel {
  background: #fff; border-radius: 12px; width: 100%;
  box-shadow: var(--gc-shadow-lg);
  max-height: 90vh; display: flex; flex-direction: column;
  animation: modalin .15s ease;
}
@keyframes modalin { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 12px;
}
.modal-header h2 { margin: 0; font-size: 18px; font-weight: 500; font-family: 'Google Sans', Roboto, sans-serif; }
.icon-btn { background: none; border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; }
.icon-btn:hover { background: var(--gc-hover); }
.modal-body { padding: 4px 24px 20px; overflow-y: auto; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 24px 20px; }
</style>
