<!-- App.vue -->
<script setup lang="ts">
import { onMounted } from 'vue';
import NotificationToast from './components/common/NotificationToast.vue';
import GameController from './components/layout/GameController.vue';
import { useGameStore } from './stores/gameStore';

const store = useGameStore();

onMounted(() => {
  store.初始化();
});
</script>

<template>
  <div class="goblin-game-controller" v-if="store.已初始化">
    <GameController />
    <NotificationToast />
  </div>
  <div v-else class="loading-state">
    <span class="loading-icon">⚔</span>
    <span>唤醒黑暗...</span>
  </div>
</template>

<style lang="scss">
@use './styles/dark-fantasy.scss';

.goblin-game-controller {
  width: 100%;
  // max-width: 480px;
  // min-width: 320px;
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 18px;
  background: var(--bg-primary);
  border: 1px solid var(--border-dark);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: var(--text-dim);
  background: var(--bg-primary);

  .loading-icon {
    animation: pulse 1.5s infinite;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
}
</style>
