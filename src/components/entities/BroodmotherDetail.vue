<!-- src/components/entities/BroodmotherDetail.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../stores/gameStore';

const store = useGameStore();
const 母畜 = computed(() => store.选中的母畜);

// 基础信息
const 基础信息 = computed(() => {
  if (!母畜.value) return [];
  return [
    { 标签: '种族', 值: 母畜.value.获取属性('种族') },
    { 标签: '原身份', 值: 母畜.value.获取属性('原身份') },
    { 标签: '年龄', 值: 母畜.value.获取属性('年龄') },
  ];
});

// 核心属性
const 核心属性 = computed(() => {
  store.检查状态更新();
  if (!母畜.value) return [];
  const 剩余 = 母畜.value.获取属性('剩余生育力');
  const 总计 = 母畜.value.获取属性('总生育力');
  return [
    {
      标签: '生育力',
      当前: 剩余,
      最大: 总计,
      颜色: 'var(--accent-poison)',
      百分比: 总计 > 0 ? (剩余 / 总计) * 100 : 0,
    },
    {
      标签: '臣服度',
      当前: 母畜.value.获取属性('臣服度'),
      最大: 100,
      颜色: 'var(--accent-corrupt)',
      百分比: 母畜.value.获取属性('臣服度'),
    },
  ];
});

// 身体属性
const 身体属性 = computed(() => {
  if (!母畜.value) return [];
  return [
    { 标签: '魅力', 值: 母畜.value.获取属性('魅力'), 图标: '♥' },
    { 标签: '生育', 值: 母畜.value.获取属性('总生育力'), 图标: '◎' },
    { 标签: '臣服', 值: 母畜.value.获取属性('臣服度'), 图标: '✧' },
    { 标签: '淫乱', 值: 母畜.value.获取属性('淫乱度'), 图标: '✧' },
  ];
});

// 状态标签
const 状态标签列表 = computed(() => {
  if (!母畜.value) return [];
  const tags: { 标签: string; 类型: string }[] = [];

  const 臣服度 = 母畜.value.获取属性('臣服度');
  if (臣服度 >= 80) {
    tags.push({ 标签: '完全臣服', 类型: 'poison' });
  } else if (臣服度 >= 50) {
    tags.push({ 标签: '半臣服', 类型: 'gold' });
  } else if (臣服度 >= 20) {
    tags.push({ 标签: '抵抗中', 类型: 'mana' });
  } else {
    tags.push({ 标签: '桀骜不驯', 类型: 'blood' });
  }

  if (母畜.value && store.检查实体是否有任务(母畜.value.实体ID)) {
    tags.push({ 标签: '执行任务中', 类型: 'mana' });
  }

  return tags;
});

// 产奶信息
const 产奶信息 = computed(() => {
  if (!母畜.value) return null;
  const 产奶量 = 母畜.value.获取属性('每回合产奶量');
  const 累计 = 母畜.value.获取属性('累计产奶量');
  if (产奶量 === undefined && 累计 === undefined) return null;
  return {
    每回合: 产奶量 ?? 0,
    累计: 累计 ?? 0,
  };
});

// 可用任务
const 可用任务列表 = computed(() => {
  if (!母畜.value) return [];

  const 所有任务 = store.游戏实例?.任务管理.获取所有任务名();
  if (!所有任务) return [];

  return 所有任务
    .filter(任务名 => {
      const 配置 = store.游戏实例?.任务管理.获取任务配置(任务名);
      if (!配置) return false;
      return 配置.执行人实体类型?.includes('母畜实体');
    })
    .map(任务名 => {
      const 配置 = store.游戏实例?.任务管理.获取任务配置(任务名);
      return {
        名称: 任务名,
        需要目标: !!配置?.目标实体类型,
      };
    });
});

// 检查是否忙碌
const 是否忙碌 = computed(() => {
  if (!母畜.value) return false;
  return store.检查实体是否有任务(母畜.value.实体ID);
});

// 处理任务点击
function 处理任务点击(任务名: string, 需要目标: boolean) {
  if (!母畜.value) return;

  if (需要目标) {
    store.开始任务目标选择(任务名, 母畜.value.实体ID);
  } else {
    store.直接发布无目标任务(任务名, 母畜.value.实体ID);
  }
}
</script>

<template>
  <div v-if="母畜" class="broodmother-detail">
    <!-- 头部 -->
    <div class="detail-header">
      <h4 class="detail-title">
        {{ 母畜.获取属性('姓名') }}
      </h4>
      <div class="status-tags">
        <span v-for="tag in 状态标签列表" :key="tag.标签" class="tag" :class="`tag--${tag.类型}`">
          {{ tag.标签 }}
        </span>
      </div>
    </div>

    <!-- 基础信息 -->
    <div class="info-grid">
      <div v-for="info in 基础信息" :key="info.标签" class="info-item">
        <span class="info-label">{{ info.标签 }}</span>
        <span class="info-value">{{ info.值 }}</span>
      </div>
    </div>

    <!-- 核心属性条 -->
    <div class="core-stats">
      <div v-for="stat in 核心属性" :key="stat.标签" class="stat-bar-item">
        <div class="stat-bar-header">
          <span class="stat-bar-label">{{ stat.标签 }}</span>
          <span class="stat-bar-value">{{ stat.当前 }} / {{ stat.最大 }}</span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-bar__fill"
            :style="{
              width: stat.百分比 + '%',
              background: stat.颜色,
            }"
          />
        </div>
      </div>
    </div>

    <!-- 身体属性 -->
    <div class="body-stats">
      <div v-for="stat in 身体属性" :key="stat.标签" class="body-stat">
        <span class="body-stat__icon">{{ stat.图标 }}</span>
        <span class="body-stat__label">{{ stat.标签 }}</span>
        <span class="body-stat__value">{{ stat.值 }}</span>
      </div>
    </div>

    <!-- 产奶信息 -->
    <div v-if="产奶信息" class="milk-info">
      <div class="milk-row">
        <span class="milk-icon">⚪</span>
        <span>每回合产奶</span>
        <span class="milk-value">+{{ 产奶信息.每回合 }}</span>
      </div>
      <div class="milk-row">
        <span class="milk-icon">∑</span>
        <span>累计产出</span>
        <span class="milk-value">{{ 产奶信息.累计 }}</span>
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
            @click="处理任务点击(task.名称, task.需要目标)"
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
