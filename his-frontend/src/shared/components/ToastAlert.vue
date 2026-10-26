<script setup lang="ts">
import { ref } from 'vue';

const visible = ref(false);
const message = ref('');
const type = ref<'success' | 'error'>('success');

const show = (msg: string, alertType: 'success' | 'error' = 'success') => {
  message.value = msg;
  type.value = alertType;
  visible.value = true;
  setTimeout(() => {
    visible.value = false;
  }, 3500);
};

// Exponer la función para que el componente padre la llame
defineExpose({ show });
</script>

<template>
  <Transition name="fade">
    <div v-if="visible" :class="['toast-alert', type]">
      {{ message }}
    </div>
  </Transition>
</template>

<style scoped>
.toast-alert {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 24px;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
}
.success { background-color: #0aa28a; }
.error { background-color: #e74c3c; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(10px); }
</style>