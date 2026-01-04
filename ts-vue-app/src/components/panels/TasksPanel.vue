<!-- components/panels/TasksPanel.vue -->
<!-- 介绍：任务面板 - 改进版，支持任务目标选择和任务详情显示 -->
<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore';
import { computed, onMounted, ref, watch } from 'vue';

const store = useGameStore();

// 任务配置类型
interface TaskConfig {
  描述?: string;
  行动力消耗?: number;
  需要目标?: boolean;
  执行人实体类型?: string;
  目标实体类型?: string;
}

const availableTasks = computed(() => {
  const taskManager = store.游戏实例?.获取任务管理器();
  if (!taskManager) return [];

  return taskManager.获取所有任务名().map(name => ({
    name,
    config: taskManager.获取任务配置(name) as TaskConfig | undefined,
  }));
});

const selectedTask = ref<string | null>(null);
const selectedExecutor = ref<string | null>(null);
const selectedTarget = ref<string | null>(null);

// ─── 消费预选任务 ───
onMounted(() => {
  应用预选任务();
});

// 监听预选状态变化
watch(
  () => store.预选任务名,
  newVal => {
    if (newVal) {
      应用预选任务();
    }
  },
);

function 应用预选任务() {
  const 预选 = store.获取预选任务();

  if (预选.任务名) {
    const taskExists = availableTasks.value.some(t => t.name === 预选.任务名);
    if (taskExists) {
      selectedTask.value = 预选.任务名;
    }
  }

  if (预选.执行人ID) {
    // 验证执行人是否可用
    const executorValid = executors.value.some(e => e.id === 预选.执行人ID && !e.busy);
    if (executorValid) {
      selectedExecutor.value = 预选.执行人ID;
    }
  }

  if (预选.目标ID) {
    selectedTarget.value = 预选.目标ID;
  }

  store.清除预选任务();
}

// 当前选中任务的配置
const currentTaskConfig = computed(() => {
  if (!selectedTask.value) return null;
  return availableTasks.value.find(t => t.name === selectedTask.value)?.config ?? null;
});

// 是否需要目标
const needsTarget = computed(() => {
  const 目标实体类型 = currentTaskConfig.value?.目标实体类型;
  if (!目标实体类型) return false;
  return true;
});

// 根据任务配置筛选可用执行人
const executors = computed(() => {
  if (!selectedTask.value || !currentTaskConfig.value) return [];

  const allowedTypes = currentTaskConfig.value.执行人实体类型 ?? '';
  const result: { id: string; name: string; type: string; busy: boolean }[] = [];

  if (allowedTypes === '冠军实体') {
    store.所有冠军.forEach(c => {
      result.push({
        id: c.实体ID,
        name: c.获取属性('姓名'),
        type: '冠军',
        busy: store.检查实体是否有任务(c.实体ID),
      });
    });
  }

  if (allowedTypes === '母畜实体') {
    store.所有母畜.forEach(m => {
      result.push({
        id: m.实体ID,
        name: m.获取属性('姓名'),
        type: '母畜',
        busy: store.检查实体是否有任务(m.实体ID),
      });
    });
  }

  return result;
});

// 根据任务配置筛选可用目标
const targets = computed(() => {
  if (!selectedTask.value || !currentTaskConfig.value || !needsTarget.value) return [];

  const allowedTypes = currentTaskConfig.value.目标实体类型 ?? ['母畜实体', '地点实体'];
  const result: { id: string; name: string; type: string; info?: string }[] = [];

  if (allowedTypes.includes('母畜实体')) {
    store.所有母畜.forEach(m => {
      result.push({
        id: m.实体ID,
        name: m.获取属性('姓名'),
        type: '母畜',
        info: `臣服度: ${m.获取属性('臣服度')}`,
      });
    });
  }

  if (allowedTypes.includes('地点实体')) {
    store.所有地点.forEach(l => {
      result.push({
        id: l.实体ID,
        name: l.地点名称,
        type: '地点',
        info: l.地点类型,
      });
    });
  }

  if (allowedTypes.includes('冠军实体')) {
    store.所有冠军.forEach(c => {
      result.push({
        id: c.实体ID,
        name: c.获取属性('姓名'),
        type: '冠军',
      });
    });
  }

  return result;
});

// 重置选择（但保留预选目标的特殊处理）
watch(selectedTask, (newVal, oldVal) => {
  // 只有在非预选触发时才重置
  if (oldVal !== null) {
    selectedExecutor.value = null;
    selectedTarget.value = null;
  }
});

// 是否可以发布
const canPublish = computed(() => {
  if (!selectedTask.value || !selectedExecutor.value) return false;
  if (needsTarget.value && !selectedTarget.value) return false;
  return true;
});

function publishTask() {
  if (!canPublish.value) return;

  store.发布任务(selectedTask.value!, selectedExecutor.value!, selectedTarget.value ?? undefined);

  // 重置选择
  selectedTask.value = null;
  selectedExecutor.value = null;
  selectedTarget.value = null;
}
</script>

<template>
  <div class="tasks-panel">
    <!-- 任务发布 -->
    <section class="panel-section">
      <h3 class="section-title">发布任务</h3>

      <!-- 任务选择 -->
      <div class="form-group">
        <label>任务类型</label>
        <div class="task-select-grid">
          <button
            v-for="task in availableTasks"
            :key="task.name"
            class="task-option"
            :class="{ 'task-option--selected': selectedTask === task.name }"
            @click="selectedTask = task.name"
          >
            <span class="task-option__name">{{ task.name }}</span>
            <span v-if="task.config?.需要目标" class="task-option__tag">需目标</span>
          </button>
        </div>
      </div>

      <!-- 任务详情 -->
      <div v-if="currentTaskConfig" class="task-info-box">
        <div class="task-info-row">
          <span class="info-label">描述:</span>
          <span class="info-value">{{ currentTaskConfig.描述 || '无描述' }}</span>
        </div>
        <div class="task-info-row">
          <span class="info-label">行动力:</span>
          <span class="info-value">{{ currentTaskConfig.行动力消耗 ?? 1 }}</span>
        </div>
        <div v-if="needsTarget" class="task-info-row">
          <span class="info-label warn">⚠ 此任务需要指定目标</span>
        </div>
      </div>

      <!-- 执行人选择 -->
      <div v-if="selectedTask" class="form-group">
        <label>执行人</label>
        <div class="executor-list">
          <button
            v-for="exec in executors"
            :key="exec.id"
            class="executor-option"
            :class="{
              'executor-option--selected': selectedExecutor === exec.id,
              'executor-option--busy': exec.busy,
            }"
            :disabled="exec.busy"
            @click="selectedExecutor = exec.id"
          >
            <span class="executor-type">[{{ exec.type }}]</span>
            <span class="executor-name">{{ exec.name }}</span>
            <span v-if="exec.busy" class="executor-busy">忙碌</span>
          </button>
        </div>
        <span v-if="executors.length === 0" class="no-data">无可用执行人</span>
      </div>

      <!-- 目标选择 -->
      <div v-if="selectedTask && selectedExecutor && needsTarget" class="form-group">
        <label>
          目标
          <span class="required-mark">*必选</span>
        </label>
        <div class="target-list">
          <button
            v-for="target in targets"
            :key="target.id"
            class="target-option"
            :class="{ 'target-option--selected': selectedTarget === target.id }"
            @click="selectedTarget = target.id"
          >
            <div class="target-main">
              <span class="target-type">[{{ target.type }}]</span>
              <span class="target-name">{{ target.name }}</span>
            </div>
            <span v-if="target.info" class="target-info">{{ target.info }}</span>
          </button>
        </div>
        <span v-if="targets.length === 0" class="no-data">无可用目标</span>
      </div>

      <button class="btn btn--primary publish-btn" :disabled="!canPublish" @click="publishTask">
        <span v-if="!selectedTask">请选择任务</span>
        <span v-else-if="!selectedExecutor">请选择执行人</span>
        <span v-else-if="needsTarget && !selectedTarget">请选择目标</span>
        <span v-else>发布任务</span>
      </button>
    </section>

    <!-- 已发布任务 -->
    <section class="panel-section">
      <h3 class="section-title">已发布任务 ({{ store.已发布任务列表.length }})</h3>

      <div v-if="store.已发布任务列表.length === 0" class="empty-hint">暂无待执行任务</div>

      <div v-else class="task-queue">
        <div v-for="task in store.已发布任务列表" :key="task.任务ID" class="task-queue-item">
          <div class="task-queue-item__info">
            <span class="task-name">{{ task.任务名 }}</span>
            <span class="task-meta">
              执行人: {{ store.获取姓名(task.执行人ID) || '未知' }}
              <template v-if="task.目标ID"> → 目标: {{ store.获取姓名(task.执行人ID) }} </template>
            </span>
            <span class="task-ap">行动力: {{ task.行动力占用 }}</span>
          </div>
          <button class="btn btn--small btn--danger" @click="store.取消任务(task.任务ID)">取消</button>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.tasks-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-section {
  background: var(--bg-tertiary);
  border-radius: 3px;
  padding: 10px;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-dark);
}

.form-group {
  margin-bottom: 12px;

  label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--text-dim);
    margin-bottom: 6px;
  }
}

.required-mark {
  font-size: 11px;
  color: var(--accent-blood-light);
  background: rgba(139, 38, 53, 0.2);
  padding: 1px 4px;
  border-radius: 2px;
}

.task-select-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.task-option {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-dark);
  border-radius: 3px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  &--selected {
    background: var(--bg-hover);
    border-color: var(--accent-blood);
    color: var(--text-primary);
  }

  &__tag {
    font-size: 10px;
    padding: 1px 4px;
    background: rgba(190, 149, 85, 0.3);
    color: var(--accent-gold);
    border-radius: 2px;
  }
}

.task-info-box {
  background: var(--bg-secondary);
  border: 1px solid var(--border-dark);
  border-radius: 3px;
  padding: 8px;
  margin-bottom: 12px;
}

.task-info-row {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;

  &:last-child {
    margin-bottom: 0;
  }

  .info-label {
    color: var(--text-dim);
    margin-right: 6px;

    &.warn {
      color: var(--warning);
    }
  }
}

.executor-list,
.target-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 120px;
  overflow-y: auto;
}

.executor-option,
.target-option {
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

  &:hover:not(:disabled) {
    background: var(--bg-hover);
  }

  &--selected {
    background: var(--bg-hover);
    border-color: var(--accent-mana);
  }

  &--busy {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.executor-type,
.target-type {
  font-size: 11px;
  color: var(--text-dim);
}

.executor-name,
.target-name {
  font-size: 13px;
  color: var(--text-primary);
}

.executor-busy {
  margin-left: auto;
  font-size: 11px;
  color: var(--warning);
}

.target-option {
  flex-direction: column;
  align-items: flex-start;
}

.target-main {
  display: flex;
  align-items: center;
  gap: 6px;
}

.target-info {
  font-size: 11px;
  color: var(--text-dim);
}

.no-data {
  font-size: 12px;
  color: var(--text-dim);
  padding: 8px;
}

.publish-btn {
  width: 100%;
  padding: 8px;
}

.empty-hint {
  font-size: 13px;
  color: var(--text-dim);
  text-align: center;
  padding: 16px;
}

.task-queue {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-queue-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  background: var(--bg-secondary);
  border-radius: 2px;

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
}

.task-name {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.task-meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.task-ap {
  font-size: 11px;
  color: var(--text-dim);
}

.btn--danger {
  border-color: var(--danger);
  color: var(--danger);

  &:hover {
    background: rgba(139, 38, 53, 0.2);
  }
}
</style>
