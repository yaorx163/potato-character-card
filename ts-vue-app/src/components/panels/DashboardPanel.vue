<!-- components/panels/DashboardPanel.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../stores/gameStore';
import ResourceBar from '../../components/common/ResourceBar.vue';

const store = useGameStore();

const 统计数据 = computed(() => ({
  冠军数量: store.所有冠军.length,
  母畜数量: store.所有母畜.length,
  地点数量: store.所有地点.length,
  喽啰总数: store.喽啰总数,
  待执行任务: store.已发布任务列表.length,
  可用魔力: store.魔力信息.当前,
}));
</script>

<template>
  <div class="dashboard-panel">
    <div class="panel panel--elevated">
      <div class="panel__header">
        <h2 class="panel__title">领地总览</h2>
        <span class="turn-indicator">第 {{ store.当前回合 }} 回合</span>
      </div>

      <div class="dashboard-grid">
        <!-- 资源卡片 -->
        <div class="resource-card">
          <h3 class="resource-card__title">🔮 魔力储备</h3>
          <ResourceBar
            label="魔力"
            :current="store.魔力信息.当前"
            :max="store.魔力信息.最大"
            color="accent"
          />
          <p class="resource-card__hint">消耗魔力施放法术</p>
        </div>

        <div class="resource-card">
          <h3 class="resource-card__title">⚔️ 军队士气</h3>
          <ResourceBar
            label="士气"
            :current="store.资源状态.士气"
            :max="store.资源状态.最大士气"
            color="success"
          />
          <p class="resource-card__hint">士气影响战斗表现</p>
        </div>

        <div class="resource-card">
          <h3 class="resource-card__title">🍼 催淫母乳</h3>
          <div class="milk-display">
            <span class="milk-value">{{ store.资源状态.催淫母乳 }}</span>
            <span class="milk-unit">单位</span>
          </div>
          <p class="resource-card__hint">用于黑市交易</p>
        </div>
      </div>

      <!-- 统计概览 -->
      <div class="stats-overview">
        <div class="stat-block">
          <span class="stat-block__icon">👺</span>
          <span class="stat-block__value">{{ 统计数据.冠军数量 }}</span>
          <span class="stat-block__label">冠军</span>
        </div>
        <div class="stat-block">
          <span class="stat-block__icon">👩</span>
          <span class="stat-block__value">{{ 统计数据.母畜数量 }}</span>
          <span class="stat-block__label">母畜</span>
        </div>
        <div class="stat-block">
          <span class="stat-block__icon">👥</span>
          <span class="stat-block__value">{{ 统计数据.喽啰总数 }}</span>
          <span class="stat-block__label">喽啰</span>
        </div>
        <div class="stat-block">
          <span class="stat-block__icon">🏘️</span>
          <span class="stat-block__value">{{ 统计数据.地点数量 }}</span>
          <span class="stat-block__label">可袭击地点</span>
        </div>
        <div class="stat-block" :class="{ 'stat-block--highlight': 统计数据.待执行任务 > 0 }">
          <span class="stat-block__icon">📋</span>
          <span class="stat-block__value">{{ 统计数据.待执行任务 }}</span>
          <span class="stat-block__label">待执行任务</span>
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="panel panel--elevated mt-lg">
      <div class="panel__header">
        <h2 class="panel__title">快速操作</h2>
      </div>
      <div class="quick-actions">
        <button class="quick-action" @click="store.切换面板('entities')">
          <span class="quick-action__icon">👥</span>
          <span class="quick-action__label">管理实体</span>
        </button>
        <button class="quick-action" @click="store.切换面板('tasks')">
          <span class="quick-action__icon">📋</span>
          <span class="quick-action__label">派遣任务</span>
        </button>
        <button class="quick-action" @click="store.切换面板('combat')">
          <span class="quick-action__icon">⚔️</span>
          <span class="quick-action__label">发起袭击</span>
        </button>
        <button class="quick-action" @click="store.切换面板('spells')">
          <span class="quick-action__icon">✨</span>
          <span class="quick-action__label">施放法术</span>
        </button>
        <button class="quick-action" @click="store.切换面板('market')">
          <span class="quick-action__icon">🏪</span>
          <span class="quick-action__label">黑市交易</span>
        </button>
      </div>
    </div>

    <!-- 当前任务列表 -->
    <div v-if="store.已发布任务列表.length > 0" class="panel panel--elevated mt-lg">
      <div class="panel__header">
        <h2 class="panel__title">待执行任务</h2>
        <span class="badge badge--accent">{{ store.已发布任务列表.length }}</span>
      </div>
      <div class="task-list">
        <div
          v-for="task in store.已发布任务列表"
          :key="task.任务ID"
          class="task-item"
        >
          <span class="task-name">{{ task.任务名 }}</span>
          <span class="task-executor">执行人: {{ task.执行人ID.slice(0, 10) }}...</span>
          <button
            class="btn btn--ghost btn--sm"
            @click="store.取消任务(task.任务ID)"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.dashboard-panel {
  max-width: 1200px;
  margin: 0 auto;
}

.turn-indicator {
  padding: $spacing-sm $spacing-lg;
  background: $color-accent;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  font-weight: 600;
  color: $bg-darkest;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
}

.resource-card {
  padding: $spacing-lg;
  background: $bg-light;
  border: 1px solid $border-medium;
  border-radius: $radius-md;

  &__title {
    font-size: $font-size-base;
    font-weight: 600;
    color: $text-highlight;
    margin: 0 0 $spacing-md;
  }

  &__hint {
    margin: $spacing-sm 0 0;
    font-size: $font-size-xs;
    color: $text-muted;
  }
}

.milk-display {
  display: flex;
  align-items: baseline;
  gap: $spacing-sm;

  .milk-value {
    font-size: $font-size-3xl;
    font-weight: 700;
    color: $color-primary-light;
  }

  .milk-unit {
    font-size: $font-size-sm;
    color: $text-muted;
  }
}

.stats-overview {
  display: flex;
  justify-content: space-between;
  padding: $spacing-lg;
  background: $bg-medium;
  border-radius: $radius-md;
}

.stat-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-md $spacing-lg;
  border-radius: $radius-md;
  transition: all $transition-fast;

  &:hover {
    background: $bg-light;
  }

  &--highlight {
    background: rgba($color-accent, 0.1);

    .stat-block__value {
      color: $color-accent;
    }
  }

  &__icon {
    font-size: $font-size-2xl;
  }

  &__value {
    font-size: $font-size-2xl;
    font-weight: 700;
    color: $text-highlight;
  }

  &__label {
    font-size: $font-size-xs;
    color: $text-muted;
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: $spacing-md;
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-lg;
  background: $bg-medium;
  border: 1px solid $border-medium;
  border-radius: $radius-md;
  cursor: pointer;
  transition: all $transition-fast;
  font-family: $font-family-ui;

  &:hover {
    border-color: $color-primary;
    background: rgba($color-primary, 0.1);
    transform: translateY(-2px);
  }

  &__icon {
    font-size: $font-size-2xl;
  }

  &__label {
    font-size: $font-size-sm;
    color: $text-secondary;
  }
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.task-item {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md $spacing-lg;
  background: $bg-medium;
  border: 1px solid $border-dark;
  border-radius: $radius-sm;

  .task-name {
    font-weight: 500;
    color: $text-primary;
  }

  .task-executor {
    flex: 1;
    font-size: $font-size-sm;
    color: $text-muted;
  }
}
</style>
