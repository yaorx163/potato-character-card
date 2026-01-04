<!-- src/components/entities/ChampionDetail.vue -->
<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore';
import { computed } from 'vue';

const store = useGameStore();
const champion = computed(() => store.选中的冠军);

const stats = computed(() => {
  if (!champion.value) return [];
  return [
    { label: '力量', value: champion.value.获取属性('力量'), color: 'var(--accent-blood)' },
    { label: '敏捷', value: champion.value.获取属性('敏捷'), color: 'var(--accent-poison)' },
    { label: '智力', value: champion.value.获取属性('智力'), color: 'var(--accent-mana)' },
  ];
});

const minionInfo = computed(() => {
  if (!champion.value) return null;
  const pool = champion.value.获取喽啰池();
  if (!pool) return null;
  return {
    current: pool.获取总数量(),
    max: pool.获取最大数量(),
    power: pool.获取战斗力(),
  };
});

const availableTasks = computed(() => {
  if (!store.游戏实例) return [];
  const allTasks = store.游戏实例?.任务管理.获取所有任务名();
  return allTasks
    .map(name => ({
      name,
      config: store.游戏实例?.任务管理.获取任务配置(name),
    }))
    .filter(t => {
      return t.config?.执行人实体类型 === '冠军实体';
    })
    .map(t => ({
      name: t.name,
      needsTarget: t.config?.目标实体类型 ? true : false,
    }));
});

function assignTask(task: { name: string; needsTarget: boolean }) {
  if (!champion.value) return;

  if (task.needsTarget) {
    store.开始任务目标选择(task.name, champion.value.实体ID);
  } else {
    store.直接发布无目标任务(task.name, champion.value.实体ID);
  }
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
      <div v-for="stat in stats" :key="stat.label" class="stat-item">
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
          <button v-for="task in availableTasks" :key="task.name" class="btn btn--small" @click="assignTask(task)">
            {{ task.name }}
          </button>
          <span v-if="availableTasks.length === 0" class="no-task"> 无可用任务 </span>
        </div>
      </div>
    </div>
  </div>

  <!-- 通用任务目标选择弹层 -->
  <Teleport to="body">
    <div v-if="store.任务选择状态.isSelecting" class="target-overlay">
      <div class="target-modal">
        <div class="modal-header">
          <h4>选择任务目标</h4>
          <span class="modal-task">{{ store.任务选择状态.taskId }}</span>
        </div>
        <div class="target-list">
          <button
            v-for="target in store.任务选择状态.availableTargets"
            :key="target.id"
            class="target-btn"
            @click="store.选择目标并发布任务(target.id)"
          >
            <span class="target-type">[{{ target.type }}]</span>
            <span class="target-name">{{ target.name }}</span>
          </button>
          <div v-if="store.任务选择状态.availableTargets.length === 0" class="no-targets">无可用目标</div>
        </div>
        <div class="modal-actions">
          <button class="btn btn--small" @click="store.取消任务选择()">取消</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
/* 原有样式保持不变，添加通用弹层样式 */
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
  flex-direction: column;
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

/* 通用弹层样式 */
.target-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  z-index: 1000;
}

.target-modal {
  width: 90%;
  max-width: 400px;
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
  max-height: 200px;
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