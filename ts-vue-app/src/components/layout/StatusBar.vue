<!-- components/layout/StatusBar.vue -->
<!-- 介绍：状态栏组件 - 可点击切换面板 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()

interface StatItem {
  id: string
  icon: string
  value: number
  max?: number
  color: string
  label: string
  panel: string // 点击后切换到的面板
}

const stats = computed<StatItem[]>(() => [
  {
    id: 'action',
    icon: '⚡',
    value: store.当前行动力,
    max: store.最大行动力,
    color: 'var(--accent-action, #f59e0b)',
    label: '行动力',
    panel: 'tasks'
  },
  {
    id: 'mana',
    icon: '◆',
    value: store.魔力信息.当前,
    max: store.魔力信息.最大,
    color: 'var(--accent-mana)',
    label: '魔力',
    panel: 'spell'
  },
  {
    id: 'morale',
    icon: '🔺',
    value: store.资源状态.士气,
    max: store.资源状态.最大士气,
    color: 'var(--accent-blood)',
    label: '士气',
    panel: 'combat'
  },
  {
    id: 'milk',
    icon: '⚪',
    value: store.资源状态.催淫母乳,
    color: 'var(--accent-corrupt)',
    label: '母乳',
    panel: 'market'
  },
])

function handleStatClick(panel: string) {
  store.切换面板(panel)
}
</script>

<template>
  <div class="status-bar">
    <div class="status-bar__lord">
      <span class="lord-icon">👑</span>
      <span class="lord-name">{{ store.领主?.获取属性('姓名') || '未命名' }}</span>
    </div>

    <div class="status-bar__resources">
      <div
        v-for="stat in stats"
        :key="stat.id"
        class="resource"
        :class="{ 'resource--clickable': true }"
        :title="`${stat.label}: ${stat.value}${stat.max ? '/' + stat.max : ''} (点击查看${stat.label}面板)`"
        @click="handleStatClick(stat.panel)"
      >
        <span class="resource__icon" :style="{ color: stat.color }">{{ stat.icon }}</span>
        <span class="resource__value">{{ stat.value }}</span>
        <template v-if="stat.max">
          <span class="resource__separator">/</span>
          <span class="resource__max">{{ stat.max }}</span>
        </template>
        <div v-if="stat.max" class="resource__bar">
          <div
            class="resource__bar-fill"
            :style="{
              width: (stat.value / stat.max * 100) + '%',
              background: stat.color
            }"
          />
        </div>
      </div>
    </div>

    <div class="status-bar__turn">
      第 {{ store.当前回合 }} 回合
    </div>
  </div>
</template>

<style lang="scss" scoped>
.status-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 10px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-dark);

  &__lord {
    display: flex;
    align-items: center;
    gap: 4px;

    .lord-icon {
      font-size: 18px;
    }
    .lord-name {
      font-size: 16px;
      color: var(--accent-gold);
      font-weight: 500;
    }
  }

  &__resources {
    display: flex;
    gap: 14px;
    flex: 1;
  }

  &__turn {
    font-size: 15px;
    color: var(--text-dim);
    padding: 2px 6px;
    background: var(--bg-tertiary);
    border-radius: 2px;
  }
}

.resource {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 3px;
  transition: background 0.15s, transform 0.1s;

  &--clickable {
    cursor: pointer;

    &:hover {
      background: var(--bg-hover, rgba(255, 255, 255, 0.08));
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &__icon {
    font-size: 15px;
  }

  &__value {
    font-size: 16px;
    color: var(--text-primary);
    font-weight: 500;
    min-width: 18px;
  }

  &__separator {
    font-size: 12px;
    color: var(--text-dim);
    opacity: 0.6;
  }

  &__max {
    font-size: 13px;
    color: var(--text-dim);
  }

  &__bar {
    width: 32px;
    height: 3px;
    background: var(--bg-tertiary);
    border-radius: 1px;
    overflow: hidden;
    margin-left: 2px;
  }

  &__bar-fill {
    height: 100%;
    transition: width 0.3s;
  }
}
</style>
