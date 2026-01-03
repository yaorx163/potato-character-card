<!-- components/entities/BroodmotherDetail.vue -->
<!-- 介绍：母畜详情页面 - 改进版，任务支持目标选择 -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '../../stores/gameStore'

const store = useGameStore()
const broodmother = computed(() => store.选中的母畜)

// 任务选择状态
const selectingTaskTarget = ref<string | null>(null)
const selectedTaskTarget = ref<string | null>(null)

// 基础信息
const basicInfo = computed(() => {
  if (!broodmother.value) return []
  return [
    { label: '种族', value: broodmother.value.获取属性('种族') },
    { label: '原身份', value: broodmother.value.获取属性('原身份') },
    { label: '年龄', value: broodmother.value.获取属性('年龄') },
  ]
})

// 核心属性
const coreStats = computed(() => {
  store.检查状态更新();
  if (!broodmother.value) return []
  const 剩余 = broodmother.value.获取属性('剩余生育力')
  const 总计 = broodmother.value.获取属性('总生育力')
  return [
    {
      label: '生育力',
      current: 剩余,
      max: 总计,
      color: 'var(--accent-poison)',
      percent: 总计 > 0 ? (剩余 / 总计) * 100 : 0
    },
    {
      label: '臣服度',
      current: broodmother.value.获取属性('臣服度'),
      max: 100,
      color: 'var(--accent-corrupt)',
      percent: broodmother.value.获取属性('臣服度')
    },
  ]
})

// 身体属性
const bodyStats = computed(() => {
  if (!broodmother.value) return []
  return [
    { label: '魅力', value: broodmother.value.获取属性('魅力'), icon: '♥' },
    { label: '胸围', value: broodmother.value.获取属性('胸围'), icon: '◎' },
    { label: '敏感度', value: broodmother.value.获取属性('敏感度'), icon: '✧' },
  ]
})

// 状态标签
const statusTags = computed(() => {
  if (!broodmother.value) return []
  const tags: { label: string; type: string }[] = []

  const 臣服度 = broodmother.value.获取属性('臣服度')
  if (臣服度 >= 80) {
    tags.push({ label: '完全臣服', type: 'poison' })
  } else if (臣服度 >= 50) {
    tags.push({ label: '半臣服', type: 'gold' })
  } else if (臣服度 >= 20) {
    tags.push({ label: '抵抗中', type: 'mana' })
  } else {
    tags.push({ label: '桀骜不驯', type: 'blood' })
  }

  // 检查是否忙碌
  if (broodmother.value && store.检查实体是否有任务(broodmother.value.实体ID)) {
    tags.push({ label: '执行任务中', type: 'mana' })
  }

  return tags
})

// 产奶信息
const milkInfo = computed(() => {
  if (!broodmother.value) return null
  const 产奶量 = broodmother.value.获取属性('每回合产奶量')
  const 累计 = broodmother.value.获取属性('累计产奶量')
  if (产奶量 === undefined && 累计 === undefined) return null
  return {
    perTurn: 产奶量 ?? 0,
    total: 累计 ?? 0
  }
})

interface TaskConfig {
  描述?: string
  需要目标?: boolean
  目标实体类型?: string|null
}

// 可用任务
const availableTasks = computed(() => {
  if (!broodmother.value) return []
  const taskManager = store.游戏实例?.获取任务管理器()
  if (!taskManager) return []

  const allTasks = taskManager.获取所有任务名()
  return allTasks
    .filter(taskName => {
      const config = taskManager.获取任务配置(taskName)
      if (!config) return false
      return config.执行人实体类型?.includes('母畜实体')
    })
    .map(taskName => {
      const config = taskManager.获取任务配置(taskName) as TaskConfig
      return {
        name: taskName,
        needsTarget: config?.需要目标 ?? false,
        targetTypes: config?.目标实体类型 ?? []
      }
    })
})

// 获取任务可选目标
const taskTargets = computed(() => {
  if (!selectingTaskTarget.value) return []

  const task = availableTasks.value.find(t => t.name === selectingTaskTarget.value)
  if (!task) return []

  const result: { id: string; name: string; type: string }[] = []

  if (task.targetTypes === '冠军实体') {
    store.所有冠军.forEach(c => {
      result.push({ id: c.实体ID, name: c.获取属性('姓名'), type: '冠军' })
    })
  }

  if (task.targetTypes === ('母畜实体')) {
    store.所有母畜
      .filter(m => m.实体ID !== broodmother.value?.实体ID)
      .forEach(m => {
        result.push({ id: m.实体ID, name: m.获取属性('姓名'), type: '母畜' })
      })
  }

  if (task.targetTypes === ('地点实体')) {
    store.所有地点.forEach(l => {
      result.push({ id: l.实体ID, name: l.地点名称, type: '地点' })
    })
  }

  return result
})

function handleTaskClick(taskName: string, needsTarget: boolean) {
  if (!broodmother.value) return

  if (needsTarget) {
    selectingTaskTarget.value = taskName
    selectedTaskTarget.value = null
  } else {
    store.发布任务(taskName, broodmother.value.实体ID)
  }
}

function confirmTaskWithTarget() {
  if (!broodmother.value || !selectingTaskTarget.value) return

  store.发布任务(
    selectingTaskTarget.value,
    broodmother.value.实体ID,
    selectedTaskTarget.value ?? undefined
  )

  selectingTaskTarget.value = null
  selectedTaskTarget.value = null
}

function cancelTaskSelection() {
  selectingTaskTarget.value = null
  selectedTaskTarget.value = null
}

// 检查是否忙碌
const isBusy = computed(() => {
  if (!broodmother.value) return false
  return store.检查实体是否有任务(broodmother.value.实体ID)
})
</script>

<template>
  <div v-if="broodmother" class="broodmother-detail">
    <!-- 头部 -->
    <div class="detail-header">
      <h4 class="detail-title">
        {{ broodmother.获取属性('姓名') }}
      </h4>
      <div class="status-tags">
        <span
          v-for="tag in statusTags"
          :key="tag.label"
          class="tag"
          :class="`tag--${tag.type}`"
        >
          {{ tag.label }}
        </span>
      </div>
    </div>

    <!-- 基础信息 -->
    <div class="info-grid">
      <div
        v-for="info in basicInfo"
        :key="info.label"
        class="info-item"
      >
        <span class="info-label">{{ info.label }}</span>
        <span class="info-value">{{ info.value }}</span>
      </div>
    </div>

    <!-- 核心属性条 -->
    <div class="core-stats">
      <div
        v-for="stat in coreStats"
        :key="stat.label"
        class="stat-bar-item"
      >
        <div class="stat-bar-header">
          <span class="stat-bar-label">{{ stat.label }}</span>
          <span class="stat-bar-value">{{ stat.current }} / {{ stat.max }}</span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-bar__fill"
            :style="{
              width: stat.percent + '%',
              background: stat.color
            }"
          />
        </div>
      </div>
    </div>

    <!-- 身体属性 -->
    <div class="body-stats">
      <div
        v-for="stat in bodyStats"
        :key="stat.label"
        class="body-stat"
      >
        <span class="body-stat__icon">{{ stat.icon }}</span>
        <span class="body-stat__label">{{ stat.label }}</span>
        <span class="body-stat__value">{{ stat.value }}</span>
      </div>
    </div>

    <!-- 产奶信息 -->
    <div v-if="milkInfo" class="milk-info">
      <div class="milk-row">
        <span class="milk-icon">✦</span>
        <span>每回合产奶</span>
        <span class="milk-value">+{{ milkInfo.perTurn }}</span>
      </div>
      <div class="milk-row">
        <span class="milk-icon">∑</span>
        <span>累计产出</span>
        <span class="milk-value">{{ milkInfo.total }}</span>
      </div>
    </div>

    <!-- 操作区 -->
    <div class="detail-actions">
      <div class="action-group">
        <span class="action-label">分配任务:</span>
        <div class="task-buttons">
          <button
            v-for="task in availableTasks"
            :key="task.name"
            class="btn btn--small"
            :class="{ 'btn--needs-target': task.needsTarget }"
            :disabled="isBusy"
            @click="handleTaskClick(task.name, task.needsTarget)"
          >
            {{ task.name }}
            <span v-if="task.needsTarget" class="target-indicator">→</span>
          </button>
          <span v-if="availableTasks.length === 0" class="no-task">
            无可用任务
          </span>
          <span v-if="isBusy" class="busy-hint">
            (任务执行中)
          </span>
        </div>
      </div>
    </div>

    <!-- 任务目标选择弹层 -->
    <div v-if="selectingTaskTarget" class="target-overlay">
      <div class="target-modal">
        <div class="modal-header">
          <h4>选择任务目标</h4>
          <span class="modal-task">{{ selectingTaskTarget }}</span>
        </div>
        <div class="target-list">
          <button
            v-for="target in taskTargets"
            :key="target.id"
            class="target-btn"
            :class="{ 'target-btn--selected': selectedTaskTarget === target.id }"
            @click="selectedTaskTarget = target.id"
          >
            <span class="target-type">[{{ target.type }}]</span>
            <span class="target-name">{{ target.name }}</span>
          </button>
          <div v-if="taskTargets.length === 0" class="no-targets">
            无可用目标
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn--small" @click="cancelTaskSelection">取消</button>
          <button
            class="btn btn--small btn--primary"
            :disabled="!selectedTaskTarget"
            @click="confirmTaskWithTarget"
          >确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.broodmother-detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
}

.detail-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.status-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 8px;
  background: var(--bg-secondary);
  border-radius: 2px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.info-label {
  font-size: 11px;
  color: var(--text-dim);
}

.info-value {
  font-size: 13px;
  color: var(--text-primary);
}

.core-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-bar-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.stat-bar-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.stat-bar-label {
  color: var(--text-secondary);
}

.stat-bar-value {
  color: var(--text-primary);
}

.progress-bar {
  height: 6px;
  background: var(--bg-primary);
  border-radius: 3px;
  overflow: hidden;

  &__fill {
    height: 100%;
    transition: width 0.3s;
    border-radius: 3px;
  }
}

.body-stats {
  display: flex;
  justify-content: space-around;
  padding: 8px;
  background: var(--bg-secondary);
  border-radius: 2px;
}

.body-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;

  &__icon {
    font-size: 14px;
    color: var(--accent-corrupt);
  }

  &__label {
    font-size: 11px;
    color: var(--text-dim);
  }

  &__value {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
  }
}

.milk-info {
  padding: 8px;
  background: rgba(107, 74, 124, 0.15);
  border: 1px solid rgba(107, 74, 124, 0.3);
  border-radius: 2px;
}

.milk-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);

  & + & {
    margin-top: 4px;
  }
}

.milk-icon {
  color: var(--accent-corrupt);
}

.milk-value {
  margin-left: auto;
  color: var(--accent-corrupt);
  font-weight: 500;
}

.detail-actions {
  margin-top: 4px;
}

.action-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.action-label {
  font-size: 12px;
  color: var(--text-dim);
}

.task-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.btn--needs-target {
  border-style: dashed;
}

.target-indicator {
  margin-left: 2px;
  font-size: 10px;
}

.no-task,
.busy-hint {
  font-size: 12px;
  color: var(--text-dim);
}

/* 目标选择弹层 */
.target-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  z-index: 10;
}

.target-modal {
  width: 90%;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: 3px;
  overflow: hidden;
}

.modal-header {
  padding: 8px 10px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-dark);

  h4 {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    margin: 0;
  }

  .modal-task {
    font-size: 11px;
    color: var(--accent-gold);
  }
}

.target-list {
  padding: 8px;
  max-height: 150px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.target-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-dark);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;

  &:hover {
    background: var(--bg-hover);
  }

  &--selected {
    border-color: var(--accent-corrupt);
    background: var(--bg-hover);
  }
}

.target-type {
  font-size: 10px;
  color: var(--text-dim);
}

.target-name {
  font-size: 12px;
  color: var(--text-primary);
}

.no-targets {
  font-size: 12px;
  color: var(--text-dim);
  text-align: center;
  padding: 16px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  padding: 8px 10px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-dark);
}
</style>
