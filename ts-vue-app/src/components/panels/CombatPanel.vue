<!-- components/panels/CombatPanel.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useGameStore } from '../../stores/gameStore';
import LocationCard from '../../components/entities/LocationCard.vue';
import ProgressRing from '../../components/common/ProgressRing.vue';

const store = useGameStore();

// 战斗配置状态
const 选中地点ID = ref<string | null>(null);
const 出战将领列表 = ref<string[]>([]);

// 计算属性
const 选中的地点 = computed(() => {
  if (!选中地点ID.value) return null;
  return store.所有地点.find(l => l.实体ID === 选中地点ID.value) ?? null;
});

const 可出战冠军 = computed(() => {
  return store.所有冠军.filter(c => {
    // 过滤掉正在执行任务的冠军
    const 被占用 = store.游戏实例?.获取任务管理器().执行人是否被占用(c.实体ID);
    return !被占用;
  });
});

const 已选将领详情 = computed(() => {
  return 出战将领列表.value.map(id => {
    const 冠军 = store.所有冠军.find(c => c.实体ID === id);
    return 冠军;
  }).filter(Boolean);
});

// 战力计算
const 我方总战力 = computed(() => {
  return 已选将领详情.value.reduce((sum, 冠军) => {
    if (!冠军) return sum;
    const 喽啰池 = 冠军.获取喽啰池();
    return sum + (喽啰池?.获取战斗力() ?? 0);
  }, 0);
});

const 敌方预估战力 = computed(() => {
  if (!选中的地点.value) return null;
  return 选中的地点.value.获取战斗力估值();
});

const 胜率预估 = computed(() => {
  if (!敌方预估战力.value || 我方总战力.value === 0) return null;
  const 比值 = 我方总战力.value / 敌方预估战力.value;
  // 简单的胜率估算
  if (比值 >= 2) return 95;
  if (比值 >= 1.5) return 80;
  if (比值 >= 1.2) return 65;
  if (比值 >= 1) return 50;
  if (比值 >= 0.8) return 35;
  if (比值 >= 0.5) return 20;
  return 5;
});

const 可以发起战斗 = computed(() => {
  return 选中地点ID.value && 出战将领列表.value.length > 0;
});

// 方法
function 选择地点(地点ID: string) {
  选中地点ID.value = 地点ID;
  // 同步到游戏管理器
  store.选择战斗目标(地点ID);
}

function 切换将领选择(将领ID: string) {
  const index = 出战将领列表.value.indexOf(将领ID);
  if (index === -1) {
    出战将领列表.value.push(将领ID);
    store.添加出战将领(将领ID);
  } else {
    出战将领列表.value.splice(index, 1);
    store.移除出战将领(将领ID);
  }
}

function 确认发起战斗() {
  if (!可以发起战斗.value) return;

  const 结果 = store.确认战斗();
  if (结果.成功) {
    // 重置选择
    选中地点ID.value = null;
    出战将领列表.value = [];
  }
}

function 获取冠军战力(冠军ID: string): number {
  const 冠军 = store.所有冠军.find(c => c.实体ID === 冠军ID);
  if (!冠军) return 0;
  return 冠军.获取喽啰池()?.获取战斗力() ?? 0;
}

function 获取冠军喽啰数(冠军ID: string): { 当前: number; 最大: number } {
  const 冠军 = store.所有冠军.find(c => c.实体ID === 冠军ID);
  if (!冠军) return { 当前: 0, 最大: 0 };
  return {
    当前: 冠军.获取喽啰池()?.获取总数量() ?? 0,
    最大: 冠军.计算可统帅喽啰数()
  };
}

// 监听地点变化，重置将领选择
watch(选中地点ID, () => {
  出战将领列表.value = [];
});
</script>

<template>
  <div class="combat-panel">
    <div class="combat-layout">
      <!-- 左侧：目标选择 -->
      <div class="panel panel--elevated target-section">
        <div class="panel__header">
          <h2 class="panel__title">选择袭击目标</h2>
        </div>
        <div class="panel__content">
          <div class="location-grid">
            <div
              v-for="location in store.所有地点"
              :key="location.实体ID"
              class="location-wrapper"
              :class="{ 'location-wrapper--selected': 选中地点ID === location.实体ID }"
              @click="选择地点(location.实体ID)"
            >
              <div class="location-mini-card">
                <div class="location-mini-card__header">
                  <span class="location-icon">🏘️</span>
                  <div class="location-info">
                    <h4 class="location-name">{{ location.地点名称 }}</h4>
                    <span class="location-type">{{ location.地点类型 }}</span>
                  </div>
                </div>
                <div class="location-mini-card__stats">
                  <div class="mini-stat">
                    <span class="mini-stat__label">侦察</span>
                    <span class="mini-stat__value">
                      {{ location.获取侦察进度() }}/{{ location.获取侦查最大值() }}
                    </span>
                  </div>
                  <div class="mini-stat">
                    <span class="mini-stat__label">战力</span>
                    <span class="mini-stat__value">
                      {{ location.获取战斗力估值() ? `≈${Math.round(location.获取战斗力估值()!)}` : '???' }}
                    </span>
                  </div>
                  <div class="mini-stat">
                    <span class="mini-stat__label">母畜</span>
                    <span class="mini-stat__value">
                      {{ location.获取已侦察母畜数量() + location.获取潜在母畜数量() }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="store.所有地点.length === 0" class="empty-state">
            <span class="empty-icon">🏘️</span>
            <p>暂无可袭击目标</p>
          </div>
        </div>
      </div>

      <!-- 中间：将领选择 -->
      <div class="panel panel--elevated army-section">
        <div class="panel__header">
          <h2 class="panel__title">编组军队</h2>
          <span class="selected-count">
            已选 {{ 出战将领列表.length }} / {{ 可出战冠军.length }}
          </span>
        </div>
        <div class="panel__content">
          <div class="champion-selector">
            <div
              v-for="champion in 可出战冠军"
              :key="champion.实体ID"
              class="champion-select-card"
              :class="{
                'champion-select-card--selected': 出战将领列表.includes(champion.实体ID)
              }"
              @click="切换将领选择(champion.实体ID)"
            >
              <div class="select-indicator">
                <span v-if="出战将领列表.includes(champion.实体ID)">✓</span>
              </div>
              <div class="champion-avatar">👺</div>
              <div class="champion-details">
                <h4 class="champion-name">{{ champion.获取属性('姓名') }}</h4>
                <div class="champion-stats">
                  <span class="stat-item">
                    <span class="stat-icon">👥</span>
                    {{ 获取冠军喽啰数(champion.实体ID).当前 }}/{{ 获取冠军喽啰数(champion.实体ID).最大 }}
                  </span>
                  <span class="stat-item">
                    <span class="stat-icon">⚔️</span>
                    {{ Math.round(获取冠军战力(champion.实体ID)) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="可出战冠军.length === 0" class="empty-state">
            <span class="empty-icon">👺</span>
            <p>无可用将领</p>
            <p class="empty-hint">所有冠军正在执行任务</p>
          </div>
        </div>
      </div>

      <!-- 右侧：战力预览 -->
      <div class="panel panel--elevated preview-section">
        <div class="panel__header">
          <h2 class="panel__title">战斗预览</h2>
        </div>
        <div class="panel__content">
          <div class="battle-preview" v-if="选中的地点">
            <!-- 目标信息 -->
            <div class="preview-target">
              <h3 class="preview-label">袭击目标</h3>
              <div class="target-display">
                <span class="target-icon">🏘️</span>
                <span class="target-name">{{ 选中的地点.地点名称 }}</span>
              </div>
            </div>

            <!-- 战力对比 -->
            <div class="power-comparison">
              <div class="power-side power-side--ally">
                <h4>我方战力</h4>
                <div class="power-value">{{ Math.round(我方总战力) }}</div>
                <div class="power-composition">
                  <div v-for="将领 in 已选将领详情" :key="将领?.实体ID" class="composition-item">
                    <span>{{ 将领?.获取属性('姓名') }}</span>
                    <span>{{ Math.round(将领?.获取喽啰池()?.获取战斗力() ?? 0) }}</span>
                  </div>
                </div>
              </div>

              <div class="power-vs">VS</div>

              <div class="power-side power-side--enemy">
                <h4>敌方战力</h4>
                <div class="power-value">
                  {{ 敌方预估战力 ? `≈${Math.round(敌方预估战力)}` : '???' }}
                </div>
                <div class="power-note" v-if="!敌方预估战力">
                  需要更多侦察情报
                </div>
              </div>
            </div>

            <!-- 胜率预估 -->
            <div class="win-rate" v-if="胜率预估 !== null">
              <h4>胜率预估</h4>
              <ProgressRing
                :value="胜率预估"
                :max="100"
                :size="100"
                :stroke-width="8"
                :color="胜率预估 >= 60 ? 'success' : 胜率预估 >= 40 ? 'warning' : 'danger'"
              >
                <span class="win-rate-value">{{ 胜率预估 }}%</span>
              </ProgressRing>
              <p class="win-rate-hint">
                <template v-if="胜率预估 >= 80">大优势，稳操胜券</template>
                <template v-else-if="胜率预估 >= 60">占优势，胜算较大</template>
                <template v-else-if="胜率预估 >= 40">势均力敌，胜负难料</template>
                <template v-else-if="胜率预估 >= 20">劣势明显，风险较高</template>
                <template v-else>极度危险，不建议进攻</template>
              </p>
            </div>

            <!-- 可能收获 -->
            <div class="potential-loot">
              <h4>可能收获</h4>
              <div class="loot-items">
                <div class="loot-item">
                  <span class="loot-icon">👩</span>
                  <span class="loot-label">母畜</span>
                  <span class="loot-value">
                    {{ 选中的地点.获取已侦察母畜数量() }}+{{ 选中的地点.获取潜在母畜数量() }}?
                  </span>
                </div>
                <div class="loot-item">
                  <span class="loot-icon">📦</span>
                  <span class="loot-label">资源</span>
                  <span class="loot-value">未知</span>
                </div>
              </div>
            </div>

            <!-- 确认按钮 -->
            <button
              class="btn btn--accent btn--lg btn--block confirm-battle-btn"
              :disabled="!可以发起战斗"
              @click="确认发起战斗"
            >
              <span class="btn-icon">⚔️</span>
              确认发起袭击
            </button>
          </div>

          <div v-else class="empty-preview">
            <span class="empty-icon">🎯</span>
            <p>选择目标以查看战斗预览</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.combat-panel {
  height: 100%;
}

.combat-layout {
  display: grid;
  grid-template-columns: 1fr 1fr 380px;
  gap: $spacing-lg;
  height: 100%;

  @media (max-width: 1400px) {
    grid-template-columns: 1fr 1fr;

    .preview-section {
      grid-column: 1 / -1;
    }
  }
}

.target-section,
.army-section,
.preview-section {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 180px);
  overflow: hidden;

  .panel__content {
    flex: 1;
    overflow-y: auto;
  }
}

.selected-count {
  font-size: $font-size-sm;
  color: $text-muted;
  padding: $spacing-xs $spacing-sm;
  background: $bg-light;
  border-radius: $radius-sm;
}

// 地点选择网格
.location-grid {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.location-wrapper {
  cursor: pointer;
  border-radius: $radius-md;
  transition: all $transition-fast;

  &:hover {
    transform: translateX(4px);
  }

  &--selected {
    .location-mini-card {
      border-color: $color-accent;
      background: rgba($color-accent, 0.1);
    }
  }
}

.location-mini-card {
  padding: $spacing-md;
  background: $bg-medium;
  border: 1px solid $border-medium;
  border-radius: $radius-md;
  transition: all $transition-fast;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    margin-bottom: $spacing-md;
  }

  &__stats {
    display: flex;
    gap: $spacing-lg;
  }
}

.location-icon {
  font-size: $font-size-2xl;
}

.location-info {
  flex: 1;
}

.location-name {
  font-size: $font-size-base;
  font-weight: 600;
  color: $text-highlight;
  margin: 0;
}

.location-type {
  font-size: $font-size-xs;
  color: $text-muted;
}

.mini-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;

  &__label {
    font-size: $font-size-xs;
    color: $text-muted;
  }

  &__value {
    font-size: $font-size-sm;
    font-weight: 600;
    color: $text-primary;
  }
}

// 冠军选择
.champion-selector {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.champion-select-card {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $bg-medium;
  border: 1px solid $border-medium;
  border-radius: $radius-md;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    border-color: $color-primary;
  }

  &--selected {
    border-color: $color-accent;
    background: rgba($color-accent, 0.1);

    .select-indicator {
      background: $color-accent;
      border-color: $color-accent;
      color: $bg-darkest;
    }
  }
}

.select-indicator {
  width: 24px;
  height: 24px;
  border: 2px solid $border-light;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-sm;
  font-weight: 700;
  transition: all $transition-fast;
}

.champion-avatar {
  width: 40px;
  height: 40px;
  background: $bg-light;
  border: 2px solid $color-primary;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-xl;
}

.champion-details {
  flex: 1;
}

.champion-name {
  font-size: $font-size-base;
  font-weight: 600;
  color: $text-highlight;
  margin: 0 0 $spacing-xs;
}

.champion-stats {
  display: flex;
  gap: $spacing-md;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: $font-size-sm;
  color: $text-secondary;

  .stat-icon {
    font-size: $font-size-base;
  }
}

// 战斗预览
.battle-preview {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.preview-label {
  font-size: $font-size-sm;
  color: $text-muted;
  margin: 0 0 $spacing-sm;
}

.target-display {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $bg-medium;
  border-radius: $radius-md;

  .target-icon {
    font-size: $font-size-2xl;
  }

  .target-name {
    font-size: $font-size-lg;
    font-weight: 600;
    color: $text-highlight;
  }
}

.power-comparison {
  display: flex;
  align-items: stretch;
  gap: $spacing-md;
}

.power-side {
  flex: 1;
  padding: $spacing-lg;
  background: $bg-medium;
  border-radius: $radius-md;
  text-align: center;

  h4 {
    font-size: $font-size-sm;
    color: $text-muted;
    margin: 0 0 $spacing-sm;
  }

  &--ally {
    border: 1px solid $color-success;

    .power-value {
      color: $color-success;
    }
  }

  &--enemy {
    border: 1px solid $color-danger;

    .power-value {
      color: $color-danger;
    }
  }
}

.power-value {
  font-size: $font-size-2xl;
  font-weight: 700;
}

.power-composition {
  margin-top: $spacing-md;
  font-size: $font-size-xs;
  color: $text-secondary;

  .composition-item {
    display: flex;
    justify-content: space-between;
    padding: $spacing-xs 0;
    border-bottom: 1px solid $border-dark;

    &:last-child {
      border-bottom: none;
    }
  }
}

.power-note {
  margin-top: $spacing-sm;
  font-size: $font-size-xs;
  color: $text-muted;
}

.power-vs {
  display: flex;
  align-items: center;
  font-size: $font-size-xl;
  font-weight: 700;
  color: $color-accent;
}

.win-rate {
  text-align: center;
  padding: $spacing-lg;
  background: $bg-medium;
  border-radius: $radius-md;

  h4 {
    font-size: $font-size-sm;
    color: $text-muted;
    margin: 0 0 $spacing-md;
  }

  :deep(.progress-ring) {
    margin: 0 auto;
  }
}

.win-rate-value {
  font-size: $font-size-xl;
  font-weight: 700;
}

.win-rate-hint {
  margin: $spacing-md 0 0;
  font-size: $font-size-sm;
  color: $text-secondary;
}

.potential-loot {
  h4 {
    font-size: $font-size-sm;
    color: $text-muted;
    margin: 0 0 $spacing-md;
  }
}

.loot-items {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.loot-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  background: $bg-medium;
  border-radius: $radius-sm;

  .loot-icon {
    font-size: $font-size-lg;
  }

  .loot-label {
    flex: 1;
    font-size: $font-size-sm;
    color: $text-secondary;
  }

  .loot-value {
    font-size: $font-size-sm;
    font-weight: 600;
    color: $text-primary;
  }
}

.confirm-battle-btn {
  margin-top: $spacing-md;

  .btn-icon {
    font-size: $font-size-lg;
  }
}

.empty-state,
.empty-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-2xl;
  color: $text-muted;

  .empty-icon {
    font-size: 3rem;
    opacity: 0.3;
    margin-bottom: $spacing-md;
  }

  p {
    margin: 0;
  }

  .empty-hint {
    font-size: $font-size-sm;
    margin-top: $spacing-xs;
  }
}
</style>
