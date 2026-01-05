<!-- components/layout/GameController.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import StatusBar from './StatusBar.vue'
import TabNav from './TabNav.vue'
import DashboardPanel from '../panels/DashboardPanel.vue'
import EntitiesPanel from '../panels/EntitiesPanel.vue'
import TasksPanel from '../panels/TasksPanel.vue'
import MinionPanel from '../panels/MinionPanel.vue'
import CombatPanel from '../panels/CombatPanel.vue'
import MarketPanel from '../panels/MarketPanel.vue'
import SpellPanel from '../panels/SpellPanel.vue'  // 新增
import TurnControl from './TurnControl.vue'

const store = useGameStore()

const tabs = [
  { id: 'dashboard', label: '总览', icon: '⚔' },
  { id: 'entities', label: '实体', icon: '♟' },
  { id: 'tasks', label: '任务', icon: '📋' },
  { id: 'minions', label: '喽啰', icon: '☠' },
  { id: 'combat', label: '战斗', icon: '🗡' },
  { id: 'spell', label: '法术', icon: '◆' },   // 新增
  { id: 'market', label: '黑市', icon: '💀' },
] as const

type EntityTab = 'champions' | 'broodmothers' | 'locations'

const entitiesTab = ref<EntityTab>('champions')
</script>

<template>
  <div class="controller">
    <StatusBar />

    <TabNav
      :tabs="tabs"
      v-model:active="store.当前面板"
    />

    <div class="controller__content">
      <KeepAlive>
        <DashboardPanel v-if="store.当前面板 === 'dashboard'"
          :tabs="tabs"
          v-model:active="store.当前面板"
          v-model:activeEntities="entitiesTab"
          @update:active="store.当前面板 = $event"
          @update:activeEntities="entitiesTab = $event"
        />
        <EntitiesPanel v-else-if="store.当前面板 === 'entities'"
          :activeEntities="entitiesTab"
          @update:active="store.当前面板 = $event"
          @update:activeEntities="entitiesTab = $event"
        />
        <TasksPanel v-else-if="store.当前面板 === 'tasks'" />
        <MinionPanel v-else-if="store.当前面板 === 'minions'" />
        <CombatPanel v-else-if="store.当前面板 === 'combat'" />
        <SpellPanel v-else-if="store.当前面板 === 'spell'" />
        <MarketPanel v-else-if="store.当前面板 === 'market'" />
      </KeepAlive>
    </div>

    <TurnControl />
  </div>
</template>

<style lang="scss" scoped>
.controller {
  display: flex;
  flex-direction: column;
  height: 500px;

  &__content {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    background: var(--bg-secondary);
  }
}
</style>
