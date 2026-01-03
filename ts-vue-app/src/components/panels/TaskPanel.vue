<!-- components/panels/TaskPanel.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGameStore } from '../../stores/gameStore';
import type { 冠军实体, 母畜实体 } from '@/core/entities';

const store = useGameStore();

// 选择状态
const 选中任务 = ref<string | null>(null);
const 选中执行人 = ref<string | null>(null);
const 选中目标 = ref<string | null>(null);

// 任务配置
const 任务列表 = computed(() =>
  store.游戏实例?.获取任务管理器().获取所有任务名() ?? []
);

// 可用执行人（未被占用）
const 可用冠军 = computed(() =>
  store.所有冠军.filter(c => !store.游戏实例?.获取任务管理器().执行人是否被占用(c.实体ID))
);

const 可用母畜 = computed(() =>
  store.所有母畜.filter(b => !store.游戏实例?.获取任务管理器().执行人是否被占用(b.实体ID))
);

// 当前任务配置
const 当前任务配置 = computed(() => {
  if (!选中任务.value) return null;
  return store.游戏实例?.获取任务管理器().获取任务配置(选中任务.value) ?? null;
});

// 目标类型推断
const 需要目标 = computed(() => {
  if (!选中任务.value) return false;
  const 任务名 = 选中任务.value;
  // 基于任务名判断是否需要目标
  return ['调教', '劝慰', '侦察', '潜入侦察', '潜入劝诱'].includes(任务名);
});

// 发布任务
function 执行发布() {
  if (!选中任务.value || !选中执行人.value) return;

  const 结果 = store.发布任务(选中任务.value, 选中执行人.value, 选中目标.value ?? undefined);

  if (结果.成功) {
    // 重置选择
    选中执行人.value = null;
    选中目标.value = null;
  }
}

// 快速检查执行人是否满足前置条件
function 检查前置条件(执行人ID: string): boolean {
  if (!选中任务.value || !store.游戏实例) return false;

  const 执行人 = store.游戏实例.实体管理.获取实体(执行人ID);
  if (!执行人) return false;

  const 结果 = store.游戏实例.获取任务管理器().检查前置条件(选中任务.value, 执行人 as any);
  return 结果.通过;
}
</script>

<template>
  <div class="task-panel">
    <div class="panel panel--elevated">
      <div class="panel__header">
        <h2 class="panel__title">任务派遣</h2>
        <span v-if="store.已发布任务列表.length > 0" class="badge badge--accent">
          {{ store.已发布任务列表.length }} 个任务待执行
        </span>
      </div>

      <div class="task-layout">
        <!-- 左侧：任务选择 -->
        <div class="task-selector">
          <h3 class="section-title">选择任务</h3>
          <div class="task-list">
            <button
              v-for="任务名 in 任务列表"
              :key="任务名"
              class="task-option"
              :class="{ 'task-option--selected': 选中任务 === 任务名 }"
              @click="选中任务 = 任务名; 选中执行人 = null; 选中目标 = null"
            >
              <span class="task-option__name">{{ 任务名 }}</span>
              <span class="task-option__desc" v-if="store.游戏实例?.获取任务管理器().获取任务配置(任务名)">
                {{ store.游戏实例.获取任务管理器().获取任务配置(任务名)?.描述 }}
              </span>
            </button>
          </div>
        </div>

        <!-- 中间：执行人选择 -->
        <div class="executor-selector" v-if="选中任务">
          <h3 class="section-title">选择执行人</h3>

          <div class="executor-group">
            <h4 class="group-title">冠军</h4>
            <div class="executor-list">
              <button
                v-for="冠军 in 可用冠军"
                :key="冠军.实体ID"
                class="executor-option"
                :class="{
                  'executor-option--selected': 选中执行人 === 冠军.实体ID,
                  'executor-option--disabled': !检查前置条件(冠军.实体ID)
                }"
                :disabled="!检查前置条件(冠军.实体ID)"
                @click="选中执行人 = 冠军.实体ID"
              >
                <span class="executor-avatar">👺</span>
                <span class="executor-name">{{ 冠军.获取属性('姓名') }}</span>
              </button>
            </div>
          </div>

          <div class="executor-group">
            <h4 class="group-title">母畜</h4>
            <div class="executor-list">
              <button
                v-for="母畜 in 可用母畜"
                :key="母畜.实体ID"
                class="executor-option"
                :class="{
                  'executor-option--selected': 选中执行人 === 母畜.实体ID,
                  'executor-option--disabled': !检查前置条件(母畜.实体ID)
                }"
                :disabled="!检查前置条件(母畜.实体ID)"
                @click="选中执行人 = 母畜.实体ID"
              >
                <span class="executor-avatar">👩</span>
                <span class="executor-name">{{ 母畜.获取属性('姓名') }}</span>
                <span class="executor-status">臣服{{ 母畜.获取属性('臣服度') }}%</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧：目标选择（如果需要）-->
        <div class="target-selector" v-if="选中任务 && 选中执行人 && 需要目标">
          <h3 class="section-title">选择目标</h3>

          <!-- 根据任务类型显示不同目标 -->
          <template v-if="['调教', '劝慰'].includes(选中任务)">
            <div class="target-list">
              <button
                v-for="母畜 in store.所有母畜.filter(b => b.实体ID !== 选中执行人)"
                :key="母畜.实体ID"
                class="target-option"
                :class="{ 'target-option--selected': 选中目标 === 母畜.实体ID }"
                @click="选中目标 = 母畜.实体ID"
              >
                <span class="target-name">{{ 母畜.获取属性('姓名') }}</span>
                <span class="target-info">臣服 {{ 母畜.获取属性('臣服度') }}%</span>
              </button>
            </div>
          </template>

          <template v-else-if="['侦察', '潜入侦察'].includes(选中任务)">
            <div class="target-list">
              <button
                v-for="地点 in store.所有地点"
                :key="地点.实体ID"
                class="target-option"
                :class="{ 'target-option--selected': 选中目标 === 地点.实体ID }"
                @click="选中目标 = 地点.实体ID"
              >
                <span class="target-name">{{ 地点.地点名称 }}</span>
                <span class="target-info">侦察 {{ 地点.获取侦察进度() }}/{{ 地点.获取侦查最大值() }}</span>
              </button>
            </div>
          </template>
        </div>
      </div>

      <!-- 确认区域 -->
      <div class="confirm-area" v-if="选中任务 && 选中执行人">
        <div class="confirm-summary">
          <span class="summary-item">
            <strong>任务:</strong> {{ 选中任务 }}
          </span>
          <span class="summary-item">
            <strong>执行人:</strong> {{ 选中执行人?.slice(0, 15) }}...
          </span>
          <span v-if="选中目标" class="summary-item">
            <strong>目标:</strong> {{ 选中目标?.slice(0, 15) }}...
          </span>
        </div>
        <button
          class="btn btn--accent btn--lg"
          :disabled="需要目标 && !选中目标"
          @click="执行发布"
        >
          📋 发布任务
        </button>
      </div>
    </div>

    <!-- 已发布任务 -->
    <div v-if="store.已发布任务列表.length > 0" class="panel panel--elevated mt-lg">
      <div class="panel__header">
        <h2 class="panel__title">已发布任务</h2>
      </div>
      <div class="published-tasks">
        <div
          v-for="task in store.已发布任务列表"
          :key="task.任务ID"
          class="published-task"
        >
          <div class="published-task__info">
            <span class="task-name">{{ task.任务名 }}</span>
            <span class="task-meta">
              行动力: {{ task.行动力占用 }}
            </span>
          </div>
          <button
            class="btn btn--danger btn--sm"
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
@use '../../styles/variables' as *;

.task-panel {
  max-width: 1400px;
  margin: 0 auto;
}

.task-layout {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: $spacing-xl;
  min-height: 400px;
}

.section-title {
  font-size: $font-size-base;
  font-weight: 600;
  color: $text-highlight;
  margin: 0 0 $spacing-md;
  padding-bottom: $spacing-sm;
  border-bottom: 1px solid $border-dark;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.task-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: $spacing-xs;
  padding: $spacing-md;
  background: $bg-medium;
  border: 1px solid $border-dark;
  border-radius: $radius-md;
  cursor: pointer;
  transition: all $transition-fast;
  text-align: left;
  font-family: $font-family-ui;

  &:hover {
    border-color: $color-primary;
  }

  &--selected {
    border-color: $color-accent;
    background: rgba($color-accent, 0.1);
  }

  &__name {
    font-size: $font-size-base;
    font-weight: 500;
    color: $text-primary;
  }

  &__desc {
    font-size: $font-size-xs;
    color: $text-muted;
  }
}

.group-title {
  font-size: $font-size-sm;
  color: $text-muted;
  margin: $spacing-md 0 $spacing-sm;
}

.executor-list,
.target-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.executor-option,
.target-option {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  background: $bg-medium;
  border: 1px solid $border-dark;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: all $transition-fast;
  font-family: $font-family-ui;

  &:hover:not(:disabled) {
    border-color: $color-primary;
  }

  &--selected {
    border-color: $color-accent;
    background: rgba($color-accent, 0.1);
  }

  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.executor-avatar {
  font-size: $font-size-lg;
}

.executor-name,
.target-name {
  flex: 1;
  font-size: $font-size-sm;
  color: $text-primary;
}

.executor-status,
.target-info {
  font-size: $font-size-xs;
  color: $text-muted;
}

.confirm-area {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: $spacing-xl;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-dark;
}

.confirm-summary {
  display: flex;
  gap: $spacing-lg;
}

.summary-item {
  font-size: $font-size-sm;
  color: $text-secondary;

  strong {
    color: $text-primary;
  }
}

.published-tasks {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.published-task {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-lg;
  background: $bg-medium;
  border: 1px solid $border-dark;
  border-radius: $radius-sm;

  &__info {
    display: flex;
    align-items: center;
    gap: $spacing-lg;
  }

  .task-name {
    font-weight: 500;
    color: $text-primary;
  }

  .task-meta {
    font-size: $font-size-sm;
    color: $text-muted;
  }
}
</style>
