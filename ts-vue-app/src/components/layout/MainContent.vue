<!-- components/layout/MainContent.vue -->
<script setup lang="ts">
import { useGameStore } from '../../stores/gameStore';
import DashboardPanel from '../../components/panels/DashboardPanel.vue';
import EntityPanel from '../../components/panels/EntityPanel.vue';
import TaskPanel from '../../components/panels/TaskPanel.vue';
import CombatPanel from '../../components/panels/CombatPanel.vue';
import SpellPanel from '../../components/panels/SpellPanel.vue';
import MarketPanel from '../../components/panels/MarketPanel.vue';

const store = useGameStore();
</script>

<template>
  <main class="main-content">
    <Transition name="fade" mode="out-in">
      <DashboardPanel v-if="store.当前面板 === 'dashboard'" key="dashboard" />
      <EntityPanel v-else-if="store.当前面板 === 'entities'" key="entities" />
      <TaskPanel v-else-if="store.当前面板 === 'tasks'" key="tasks" />
      <CombatPanel v-else-if="store.当前面板 === 'combat'" key="combat" />
      <SpellPanel v-else-if="store.当前面板 === 'spells'" key="spells" />
      <MarketPanel v-else-if="store.当前面板 === 'market'" key="market" />
    </Transition>
  </main>
</template>

<style scoped lang="scss">
@use '../../styles/variables' as *;

.main-content {
  flex: 1;
  padding: $spacing-xl;
  overflow-y: auto;
  background:
    radial-gradient(ellipse at top, rgba($color-primary, 0.03) 0%, transparent 50%),
    $bg-darkest;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity $transition-fast;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
