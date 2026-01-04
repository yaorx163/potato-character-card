<!-- src/components/entities/ChampionDetail.vue -->
<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore';
import { computed } from 'vue';

const store = useGameStore();
const 冠军 = computed(() => store.选中的冠军);

const 属性列表 = computed(() => {
  if (!冠军.value) return [];
  return [
    { 标签: '力量', 值: 冠军.value.获取属性('力量'), 颜色: 'var(--accent-blood)' },
    { 标签: '敏捷', 值: 冠军.value.获取属性('敏捷'), 颜色: 'var(--accent-poison)' },
    { 标签: '智力', 值: 冠军.value.获取属性('智力'), 颜色: 'var(--accent-mana)' },
  ];
});

const 喽啰信息 = computed(() => {
  if (!冠军.value) return null;
  const pool = 冠军.value.获取喽啰池();
  if (!pool) return null;
  return {
    当前: pool.获取总数量(),
    最大: pool.获取最大数量(),
    战斗力: pool.获取战斗力(),
  };
});

// 可用任务列表
const 可用任务列表 = computed(() => {
  if (!store.游戏实例) return [];
  const 所有任务 = store.游戏实例?.任务管理.获取所有任务名();
  return 所有任务
    .map(name => ({
      名称: name,
      配置: store.游戏实例?.任务管理.获取任务配置(name),
    }))
    .filter(t => t.配置?.执行人实体类型 === '冠军实体')
    .map(t => ({
      名称: t.名称,
      需要目标: !!t.配置?.目标实体类型,
    }));
});

// 是否忙碌
const 是否忙碌 = computed(() => {
  if (!冠军.value) return false;
  return store.检查实体是否有任务(冠军.value.实体ID);
});

function 分配任务(任务名: string, 需要目标: boolean) {
  if (!冠军.value) return;

  if (需要目标) {
    store.开始任务目标选择(任务名, 冠军.value.实体ID);
  } else {
    store.直接发布无目标任务(任务名, 冠军.value.实体ID);
  }
}
</script>

<template>
  <div v-if="冠军" class="champion-detail">
    <h4 class="detail-title">
      {{ 冠军.获取属性('姓名') }}
      <span class="tag tag--blood">冠军</span>
      <span v-if="是否忙碌" class="tag tag--mana">执行任务中</span>
    </h4>

    <!-- 属性 -->
    <div class="stat-row">
      <div v-for="stat in 属性列表" :key="stat.标签" class="stat-item">
        <span class="stat-item__label">{{ stat.标签 }}</span>
        <span class="stat-item__value" :style="{ color: stat.颜色 }">
          {{ stat.值 }}
        </span>
      </div>
    </div>

    <!-- 喽啰池 -->
    <div v-if="喽啰信息" class="minion-info">
      <div class="info-row">
        <span>喽啰</span>
        <span>{{ 喽啰信息.当前 }} / {{ 喽啰信息.最大 }}</span>
      </div>
      <div class="info-row">
        <span>战斗力</span>
        <span class="text-accent">{{ Math.round(喽啰信息.战斗力) }}</span>
      </div>
    </div>

    <!-- 操作区 -->
    <div class="detail-actions">
      <div class="action-group">
        <span class="action-label">分配任务:</span>
        <div class="task-buttons">
          <button
            v-for="task in 可用任务列表"
            :key="task.名称"
            class="btn btn--small"
            :class="{ 'btn--needs-target': task.需要目标 }"
            :disabled="是否忙碌"
            @click="分配任务(task.名称, task.需要目标)"
          >
            {{ task.名称 }}
          </button>
          <span v-if="可用任务列表.length === 0" class="no-task">无可用任务</span>
          <span v-if="是否忙碌" class="busy-hint">(任务执行中)</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 目标选择弹层 -->
  <Teleport to="body">
    <div v-if="store.任务选择状态.正在选择" class="target-overlay" @click.self="store.取消任务选择()">
      <div class="target-modal">
        <div class="modal-header">
          <h4>{{ store.当前选择层级标题 }}</h4>
          <span class="modal-task">{{ store.任务选择状态.任务名 }}</span>
        </div>

        <div v-if="store.任务选择状态.是否双层选择 && store.任务选择状态.当前层级 === 1" class="modal-back">
          <button class="btn btn--small btn--back" @click="store.返回上一层选择()">
            ← 返回选择地点
          </button>
        </div>

        <div class="target-list">
          <button
            v-for="target in store.任务选择状态.可选目标列表"
            :key="target.id"
            class="target-btn"
            @click="store.选择目标(target.id)"
          >
            <div class="target-main">
              <span class="target-type">[{{ target.类型 }}]</span>
              <span class="target-name">{{ target.名称 }}</span>
            </div>
            <span v-if="target.附加信息" class="target-info">{{ target.附加信息 }}</span>
          </button>
          <div v-if="store.任务选择状态.可选目标列表.length === 0" class="no-targets">无可用目标</div>
        </div>

        <div class="modal-actions">
          <button class="btn btn--small" @click="store.取消任务选择()">取消</button>
        </div>
      </div>
    </div>
  </Teleport>
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
  align-items: center;
}

.btn--needs-target {
  border-style: dashed;
}

.no-task,
.busy-hint {
  font-size: 12px;
  color: var(--text-dim);
}

/* 目标选择弹层 */
.target-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
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

.modal-back {
  padding: 6px 10px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-dark);
}

.btn--back {
  font-size: 11px;
  color: var(--text-secondary);

  &:hover {
    color: var(--text-primary);
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
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-dark);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;

  &:hover {
    background: var(--bg-hover);
    border-color: var(--accent-mana);
  }
}

.target-main {
  display: flex;
  align-items: center;
  gap: 6px;
}

.target-type {
  font-size: 10px;
  color: var(--text-dim);
}

.target-name {
  font-size: 12px;
  color: var(--text-primary);
}

.target-info {
  font-size: 11px;
  color: var(--text-dim);
  margin-left: 16px;
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
