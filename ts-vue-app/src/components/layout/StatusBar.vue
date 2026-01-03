<!-- components/layout/StatusBar.vue -->
<!-- 介绍：状态栏组件 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()

const stats = computed(() => [
  {
    id: 'mana',
    icon: '◆',
    value: store.魔力信息.当前,
    max: store.魔力信息.最大,
    color: 'var(--accent-mana)',
    label: '魔力'
  },
  {
    id: 'morale',
    icon: '♦',
    value: store.资源状态.士气,
    max: store.资源状态.最大士气,
    color: 'var(--accent-blood)',
    label: '士气'
  },
  {
    id: 'milk',
    icon: '✦',
    value: store.资源状态.催淫母乳,
    color: 'var(--accent-corrupt)',
    label: '母乳'
  },
])
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
        :title="`${stat.label}: ${stat.value}${stat.max ? '/' + stat.max : ''}`"
      >
        <span class="resource__icon" :style="{ color: stat.color }">{{ stat.icon }}</span>
        <span class="resource__value">{{ stat.value }}</span>
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
    gap: 10px;
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

  &__icon {
    font-size: 15px;
  }

  &__value {
    font-size: 16px;
    color: var(--text-primary);
    min-width: 20px;
  }

  &__bar {
    width: 30px;
    height: 3px;
    background: var(--bg-tertiary);
    border-radius: 1px;
    overflow: hidden;
  }

  &__bar-fill {
    height: 100%;
    transition: width 0.3s;
  }
}
</style>
