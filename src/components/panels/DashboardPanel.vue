<!-- components/panels/DashboardPanel.vue -->
<!-- 介绍：军团管理面板 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()

const entityCounts = computed(() => [
  { label: '冠军', count: store.所有冠军.length, icon: '♞' },
  { label: '母畜', count: store.所有母畜.length, icon: '♀' },
  { label: '喽啰', count: store.喽啰总数, icon: '☠' },
  { label: '地点', count: store.所有地点.length, icon: '⚑' },
])

const recentTasks = computed(() =>
  store.已发布任务列表.slice(0, 3)
)

interface Tab {
  id: string
  label: string
  icon: string
}
type EntityTab = 'champions' | 'broodmothers' | 'locations'

const props = defineProps<{
  tabs: readonly Tab[]
  active: string
}>()

const emit = defineEmits<{
  'update:active': [value: string]
  'update:activeEntities': [value: EntityTab]
}>()

function clickTabs(label: string) {
  switch (label) {
    case '冠军':
      emit('update:activeEntities', 'champions')
      store.清除选择()
      emit('update:active', 'entities')
      break
    case '母畜':
      emit('update:active', 'entities')
      store.清除选择()
      emit('update:activeEntities', 'broodmothers')
      break
    case '地点':
      emit('update:active', 'entities')
      store.清除选择()
      emit('update:activeEntities', 'locations')
      break
    case '喽啰':
      emit('update:active', 'minions')
    break
    default:
      break
  }
}



</script>

<template>
  <div class="dashboard">
    <!-- 实体统计 -->
    <section class="dashboard__section">
      <h3 class="section-title">军团概况</h3>
      <div class="stat-grid">
        <div v-for="entity in entityCounts" :key="entity.label" class="stat-card" @click="clickTabs(entity.label)">
          <span class="stat-card__icon">{{ entity.icon }}</span>
          <span class="stat-card__value">{{ entity.count }}</span>
          <span class="stat-card__label">{{ entity.label }}</span>
        </div>
      </div>
    </section>

    <!-- 待执行任务 -->
    <section class="dashboard__section">
      <h3 class="section-title">待执行任务</h3>
      <div v-if="recentTasks.length === 0" class="empty-hint">
        暂无任务
      </div>
      <div v-else class="task-list">
        <div v-for="task in recentTasks" :key="task.任务ID" class="task-item">
          <span class="task-item__name">{{ task.任务名 }}</span>
          <button class="btn btn--small" @click="store.取消任务(task.任务ID)">
            取消
          </button>
        </div>
      </div>
    </section>

    <!-- 快捷操作 -->
    <section class="dashboard__section">
      <h3 class="section-title">快捷操作</h3>
      <div class="quick-actions">
        <button class="btn" @click="store.切换面板('entities')">
          管理实体
        </button>
        <button class="btn" @click="store.切换面板('combat')">
          部署战斗
        </button>
        <button class="btn" @click="store.切换面板('market')">
          黑市交易
        </button>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__section {
    background: var(--bg-tertiary);
    border-radius: 3px;
    padding: 8px;
  }
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border-dark);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  background: var(--bg-secondary);
  border-radius: 2px;

  &__icon {
    font-size: 20px;
    margin-bottom: 2px;
  }

  &__value {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__label {
    font-size: 18px;
    color: var(--text-dim);
  }
}

.empty-hint {
  font-size: 16px;
  color: var(--text-dim);
  text-align: center;
  padding: 12px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px;
  background: var(--bg-secondary);
  border-radius: 2px;

  &__name {
    font-size: 16px;
    color: var(--text-primary);
  }
}

.quick-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
</style>
