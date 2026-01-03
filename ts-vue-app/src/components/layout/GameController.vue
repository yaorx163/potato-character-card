<!-- components/layout/GameController.vue -->
<!-- 介绍：游戏控制器组件，用于管理游戏流程和显示游戏面板。 -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import StatusBar from './StatusBar.vue'
import TabNav from './TabNav.vue'
import DashboardPanel from '../panels/DashboardPanel.vue'
import EntitiesPanel from '../panels/EntitiesPanel.vue'
import TasksPanel from '../panels/TasksPanel.vue'
import MinionPanel from '../panels/MinionPanel.vue'
import CombatPanel from '../panels/CombatPanel.vue'
import MarketPanel from '../panels/MarketPanel.vue'
import TurnControl from './TurnControl.vue'

const store = useGameStore()

const tabs = [
  { id: 'dashboard', label: '总览', icon: '⚔' },
  { id: 'entities', label: '实体', icon: '♟' },
  { id: 'tasks', label: '任务', icon: '📋' },
  { id: 'minions', label: '喽啰', icon: '☠' },
  { id: 'combat', label: '战斗', icon: '🗡' },
  { id: 'market', label: '黑市', icon: '💀' },
] as const

type EntityTab = 'champions' | 'broodmothers' | 'locations'

const activeTab = ref<string>('dashboard')
const entitiesTab = ref<EntityTab>('champions')
</script>

<template>
  <div class="controller">
    <!-- 顶部状态栏 -->
    <StatusBar />

    <!-- 标签导航 -->
    <TabNav
      :tabs="tabs"
      v-model:active="activeTab"
    />

    <!-- 内容区域 -->
    <div class="controller__content">
      <KeepAlive>
        <DashboardPanel v-if="activeTab === 'dashboard'"
          :tabs="tabs"
          v-model:active="activeTab"
          v-model:activeEntities="entitiesTab"
          @update:active="activeTab = $event"
          @update:activeEntities="entitiesTab = $event"
        />
        <EntitiesPanel v-else-if="activeTab === 'entities'"
          :activeEntities="entitiesTab"
          @update:activeEntities="entitiesTab = $event"
        />
        <TasksPanel v-else-if="activeTab === 'tasks'" />
        <MinionPanel v-else-if="activeTab === 'minions'" />
        <CombatPanel v-else-if="activeTab === 'combat'" />
        <MarketPanel v-else-if="activeTab === 'market'" />
      </KeepAlive>
    </div>

    <!-- 底部回合控制 -->
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
