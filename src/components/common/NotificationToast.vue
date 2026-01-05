<!-- components/common/NotificationToast.vue -->
<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()

const iconMap = {
  success: '✓',
  warning: '!',
  error: '✗',
  info: 'i'
}
</script>

<template>
  <Teleport to="body">
    <TransitionGroup
      name="toast"
      tag="div"
      class="toast-container"
    >
      <div
        v-for="notification in store.通知列表"
        :key="notification.id"
        class="toast"
        :class="`toast--${notification.类型}`"
      >
        <span class="toast__icon">{{ iconMap[notification.类型] }}</span>
        <span class="toast__message">{{ notification.消息 }}</span>
        <button
          class="toast__close"
          @click="store.移除通知(notification.id)"
        >×</button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<style lang="scss" scoped>
.toast-container {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 280px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-dark);
  border-radius: 3px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);

  &--success {
    border-left: 3px solid var(--success);

    .toast__icon { color: var(--success); }
  }

  &--warning {
    border-left: 3px solid var(--warning);

    .toast__icon { color: var(--warning); }
  }

  &--error {
    border-left: 3px solid var(--danger);

    .toast__icon { color: var(--danger); }
  }

  &--info {
    border-left: 3px solid var(--info);

    .toast__icon { color: var(--info); }
  }

  &__icon {
    font-size: 18px;
    font-weight: bold;
  }

  &__message {
    flex: 1;
    font-size: 16px;
    color: var(--text-primary);
  }

  &__close {
    background: none;
    border: none;
    color: var(--text-dim);
    cursor: pointer;
    font-size: 20px;
    padding: 0;

    &:hover {
      color: var(--text-primary);
    }
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
