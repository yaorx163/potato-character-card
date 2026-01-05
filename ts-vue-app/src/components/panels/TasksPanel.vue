<!-- components/panels/TasksPanel.vue -->
<!-- 介绍：任务面板 - 支持单层/双层目标选择 -->
<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore';
import { computed, onMounted, ref, watch } from 'vue';

const store = useGameStore();

// 任务配置类型
interface 任务配置 {
  描述?: string;
  行动力消耗?: number;
  需要目标?: boolean;
  执行人实体类型?: string;
  目标实体类型?: string;
}

// 可用任务列表
const 可用任务列表 = computed(() => {
  if (!store.游戏实例) return [];
  return store.游戏实例?.任务管理.获取所有任务名().map(name => ({
    名称: name,
    配置: store.游戏实例?.任务管理.获取任务配置(name) as 任务配置 | undefined,
  }));
});

const 选中任务 = ref<string | null>(null);
const 选中执行人 = ref<string | null>(null);

// ─── 消费预选任务 ───
onMounted(() => {
  应用预选任务();
});

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
    const 任务存在 = 可用任务列表.value.some(t => t.名称 === 预选.任务名);
    if (任务存在) {
      选中任务.value = 预选.任务名;
    }
  }

  if (预选.执行人ID) {
    const 执行人有效 = 执行人列表.value.some(e => e.id === 预选.执行人ID && !e.忙碌);
    if (执行人有效) {
      选中执行人.value = 预选.执行人ID;
    }
  }

  store.清除预选任务();
}

// 当前选中任务的配置
const 当前任务配置 = computed(() => {
  if (!选中任务.value) return null;
  return 可用任务列表.value.find(t => t.名称 === 选中任务.value)?.配置 ?? null;
});

// 是否需要目标
const 需要目标 = computed(() => {
  const 目标类型 = 当前任务配置.value?.目标实体类型;
  return !!目标类型;
});

// 是否需要双层选择
const 需要双层选择 = computed(() => {
  return 当前任务配置.value?.目标实体类型 === '可袭击地点实体-母畜实体';
});

// 根据任务配置筛选可用执行人
const 执行人列表 = computed(() => {
  if (!选中任务.value || !当前任务配置.value) return [];

  const 允许类型 = 当前任务配置.value.执行人实体类型 ?? '';
  const 结果: { id: string; 名称: string; 类型: string; 忙碌: boolean }[] = [];

  if (允许类型 === '冠军实体') {
    store.所有冠军.forEach(c => {
      结果.push({
        id: c.实体ID,
        名称: c.获取属性('姓名'),
        类型: '冠军',
        忙碌: store.检查实体是否有任务(c.实体ID),
      });
    });
  }

  if (允许类型 === '母畜实体') {
    store.所有母畜.forEach(m => {
      结果.push({
        id: m.实体ID,
        名称: m.获取属性('姓名'),
        类型: '母畜',
        忙碌: store.检查实体是否有任务(m.实体ID),
      });
    });
  }

  return 结果;
});

// 重置选择
watch(选中任务, (newVal, oldVal) => {
  if (oldVal !== null) {
    选中执行人.value = null;
  }
});

// 是否可以发布/进入目标选择
const 可以继续 = computed(() => {
  return !!选中任务.value && !!选中执行人.value;
});

// 发布任务或开始目标选择
function 处理发布() {
  if (!可以继续.value || !选中任务.value || !选中执行人.value) return;

  if (需要目标.value) {
    // 需要选择目标，进入目标选择流程
    store.开始任务目标选择(选中任务.value, 选中执行人.value);
  } else {
    // 无需目标，直接发布
    store.直接发布无目标任务(选中任务.value, 选中执行人.value);
    重置选择();
  }
}

function 重置选择() {
  选中任务.value = null;
  选中执行人.value = null;
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
            v-for="task in 可用任务列表"
            :key="task.名称"
            class="task-option"
            :class="{ 'task-option--selected': 选中任务 === task.名称 }"
            @click="选中任务 = task.名称"
          >
            <span class="task-option__name">{{ task.名称 }}</span>
            <!-- <span v-if="task.配置?.目标实体类型 === '可袭击地点实体-母畜实体'" class="task-option__tag task-option__tag--double">
              双层目标
            </span>
            <span v-else-if="task.配置?.目标实体类型" class="task-option__tag">需目标</span> -->
          </button>
        </div>
      </div>

      <!-- 任务详情 -->
      <div v-if="当前任务配置" class="task-info-box">
        <div class="task-info-row">
          <span class="info-label">描述:</span>
          <span class="info-value">{{ 当前任务配置.描述 || '无描述' }}</span>
        </div>
        <div class="task-info-row">
          <span class="info-label">行动力:</span>
          <span class="info-value">{{ 当前任务配置.行动力消耗 ?? 1 }}</span>
        </div>
        <div v-if="需要双层选择" class="task-info-row">
          <span class="info-label hint--double">⚠ 需先选择地点，再选择母畜</span>
        </div>
        <div v-else-if="需要目标" class="task-info-row">
          <span class="info-label hint">⚠ 此任务需要指定目标</span>
        </div>
      </div>

      <!-- 执行人选择 -->
      <div v-if="选中任务" class="form-group">
        <label>执行人</label>
        <div class="executor-list">
          <button
            v-for="exec in 执行人列表"
            :key="exec.id"
            class="executor-option"
            :class="{
              'executor-option--selected': 选中执行人 === exec.id,
              'executor-option--busy': exec.忙碌,
            }"
            :disabled="exec.忙碌"
            @click="选中执行人 = exec.id"
          >
            <span class="executor-type">[{{ exec.类型 }}]</span>
            <span class="executor-name">{{ exec.名称 }}</span>
            <span v-if="exec.忙碌" class="executor-busy">忙碌</span>
          </button>
        </div>
        <span v-if="执行人列表.length === 0" class="no-data">无可用执行人</span>
      </div>

      <button class="btn btn--primary publish-btn" :disabled="!可以继续" @click="处理发布">
        <span v-if="!选中任务">请选择任务</span>
        <span v-else-if="!选中执行人">请选择执行人</span>
        <span v-else-if="需要目标">选择目标</span>
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
              执行人: {{ store.获取姓名(task.执行人ID) || '未1知' }}
              <template v-if="task.目标ID"> → 目标: {{ store.获取姓名(task.目标ID) }} </template>
            </span>
            <span class="task-ap">行动力: {{ task.行动力占用 }}</span>
          </div>
          <button class="btn btn--small btn--danger" @click="store.取消任务(task.任务ID)">取消</button>
        </div>
      </div>
    </section>

    <!-- 目标选择弹层 -->
    <Teleport to="body">
      <div v-if="store.任务选择状态.正在选择" class="target-overlay" @click.self="store.取消任务选择()">
        <div class="target-modal">
          <div class="modal-header">
            <h4>{{ store.当前选择层级标题 }}</h4>
            <span class="modal-task">{{ store.任务选择状态.任务名 }}</span>
          </div>

          <!-- 返回按钮（双层选择第二层时显示） -->
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
            <div v-if="store.任务选择状态.可选目标列表.length === 0" class="no-targets">
              无可用目标
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn btn--small" @click="store.取消任务选择()">取消</button>
          </div>
        </div>
      </div>
    </Teleport>
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

    &--double {
      background: rgba(139, 38, 53, 0.3);
      color: var(--accent-blood-light);
    }
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

    &.hint {
      color: var(--warning);
    }

    &.hint--double {
      color: var(--accent-blood-light);
    }
  }
}

.executor-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 120px;
  overflow-y: auto;
}

.executor-option {
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

.executor-type {
  font-size: 11px;
  color: var(--text-dim);
}

.executor-name {
  font-size: 13px;
  color: var(--text-primary);
}

.executor-busy {
  margin-left: auto;
  font-size: 11px;
  color: var(--warning);
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
  max-height: 250px;
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
  font-size: 13px;
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
