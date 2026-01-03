<!-- components/entities/ChampionDetail.vue -->
<!-- 介绍：哥布林冠军的详情页面 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()
const champion = computed(() => store.选中的冠军)

const stats = computed(() => {
  if (!champion.value) return []
  return [
    { label: '力量', value: champion.value.获取属性('力量'), color: 'var(--accent-blood)' },
    { label: '敏捷', value: champion.value.获取属性('敏捷'), color: 'var(--accent-poison)' },
    { label: '智力', value: champion.value.获取属性('智力'), color: 'var(--accent-mana)' },
  ]
})

const minionInfo = computed(() => {
  if (!champion.value) return null
  const pool = champion.value.获取喽啰池()
  if (!pool) return null
  return {
    current: pool.获取总数量(),
    max: pool.获取最大数量(),
    power: pool.获取战斗力()
  }
})

const availableTasks = computed(() => {
  if (!champion.value) return []
  const taskManager = store.游戏实例?.获取任务管理器()
  if (!taskManager) return []

  const allTasks = taskManager.获取所有任务名()
  return allTasks.filter(taskName => {
    const config = taskManager.获取任务配置(taskName)
    if (!config) return false
    // 检查是否可以由母畜执行
    return config.执行人实体类型?.includes('冠军实体')
  })
})

function assignTask(taskName: string) {
  if (!champion.value) return
  store.发布任务(taskName, champion.value.实体ID)
}


</script>

<template>
  <div v-if="champion" class="champion-detail">
    <h4 class="detail-title">
      {{ champion.获取属性('姓名') }}
      <span class="tag tag--blood">冠军</span>
    </h4>

    <!-- 属性 -->
    <div class="stat-row">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="stat-item"
      >
        <span class="stat-item__label">{{ stat.label }}</span>
        <span class="stat-item__value" :style="{ color: stat.color }">
          {{ stat.value }}
        </span>
      </div>
    </div>

    <!-- 喽啰池 -->
    <div v-if="minionInfo" class="minion-info">
      <div class="info-row">
        <span>喽啰</span>
        <span>{{ minionInfo.current }} / {{ minionInfo.max }}</span>
      </div>
      <div class="info-row">
        <span>战斗力</span>
        <span class="text-accent">{{ Math.round(minionInfo.power) }}</span>
      </div>
    </div>

    <!-- 操作区 -->
    <div class="detail-actions">
      <div class="action-group">
        <span class="action-label">分配任务:</span>
        <div class="task-buttons">
          <button
            v-for="task in availableTasks"
            :key="task"
            class="btn btn--small"
            @click="assignTask(task)"
          >
            {{ task }}
          </button>
          <span v-if="availableTasks.length === 0" class="no-task">
            无可用任务
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.champion-detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.stat-row {
  display: flex;
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;

  &__label {
    font-size: 18px;
    color: var(--text-dim);
  }

  &__value {
    font-size: 16px;
    font-weight: 600;
  }
}

.minion-info {
  background: var(--bg-secondary);
  padding: 6px 8px;
  border-radius: 2px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 15px;
  color: var(--text-secondary);

  & + & {
    margin-top: 4px;
  }
}

.text-accent {
  color: var(--accent-gold);
}

.detail-actions {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.action-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.action-label {
  font-size: 15px;
  color: var(--text-dim);
}

.task-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.no-task {
  font-size: 15px;
  color: var(--text-dim);
}
</style>
