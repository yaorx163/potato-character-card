<!-- components/panels/SpellPanel.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGameStore } from '../../stores/gameStore';

const store = useGameStore();

// 状态
const 选中法术 = ref<string | null>(null);
const 施法倍率 = ref(1);
const 选中目标ID = ref<string | null>(null);

// 获取所有法术
const 法术列表 = computed(() => {
  return store.游戏实例?.获取法术管理器().获取所有法术名() ?? [];
});

// 当前选中法术的配置
const 当前法术配置 = computed(() => {
  if (!选中法术.value) return null;
  return store.游戏实例?.获取法术管理器().获取法术配置(选中法术.value) ?? null;
});

// 计算当前消耗
const 当前消耗 = computed(() => {
  if (!当前法术配置.value) return 0;
  return 当前法术配置.value.价格 * 施法倍率.value;
});

// 是否需要目标
const 需要目标 = computed(() => {
  if (!当前法术配置.value) return false;
  return 当前法术配置.value.目标类型 !== '无';
});

// 目标选项
const 目标选项 = computed(() => {
  if (!当前法术配置.value) return [];

  const 目标类型 = 当前法术配置.value.目标类型;

  switch (目标类型) {
    case '母畜实体':
      return store.所有母畜.map(b => ({
        id: b.实体ID,
        名称: b.获取属性('姓名'),
        描述: `${b.获取属性('种族')} - 臣服${b.获取属性('臣服度')}%`,
        图标: '👩'
      }));
    case '冠军实体':
      return store.所有冠军.map(c => ({
        id: c.实体ID,
        名称: c.获取属性('姓名'),
        描述: `战力 ${Math.round(c.获取喽啰池()?.获取战斗力() ?? 0)}`,
        图标: '👺'
      }));
    case '可攻击地点实体':
      return store.所有地点.map(l => ({
        id: l.实体ID,
        名称: l.地点名称,
        描述: l.地点类型,
        图标: '🏘️'
      }));
    default:
      return [];
  }
});

// 是否可以施法
const 可以施法 = computed(() => {
  if (!选中法术.value) return false;
  if (当前消耗.value > store.魔力信息.当前) return false;
  if (需要目标.value && !选中目标ID.value) return false;
  return true;
});

// 方法
function 选择法术(法术名: string) {
  选中法术.value = 法术名;
  施法倍率.value = 1;
  选中目标ID.value = null;
}

function 增加倍率() {
  const 新消耗 = 当前消耗.value + (当前法术配置.value?.价格 ?? 0);
  if (新消耗 <= store.魔力信息.当前) {
    施法倍率.value++;
  }
}

function 减少倍率() {
  if (施法倍率.value > 1) {
    施法倍率.value--;
  }
}

function 施放法术() {
  if (!可以施法.value || !选中法术.value) return;

  const 结果 = store.使用法术(选中法术.value, 施法倍率.value, 选中目标ID.value ?? undefined);

  if (结果.成功) {
    // 重置状态
    选中法术.value = null;
    施法倍率.value = 1;
    选中目标ID.value = null;
  }
}

// 获取法术图标
function 获取法术图标(法术名: string): string {
  const 图标映射: Record<string, string> = {
    '繁殖催化': '🧬',
    '魅惑光环': '💫',
    '快速孵化': '🥚',
    '力量祝福': '💪',
    '恐惧光环': '😱',
    '治愈之光': '✨',
    '狂暴': '🔥',
    '虚弱诅咒': '💀',
  };
  return 图标映射[法术名] ?? '✦';
}

// 获取法术效果描述
function 获取效果描述(法术配置: any): string {
  if (!法术配置.效果) return '';
  return Object.entries(法术配置.效果)
    .map(([key, value]) => `${key}: +${value}`)
    .join(', ');
}
</script>

<template>
  <div class="spell-panel">
    <div class="spell-layout">
      <!-- 左侧：法术列表 -->
      <div class="panel panel--elevated spell-list-section">
        <div class="panel__header">
          <h2 class="panel__title">可用法术</h2>
          <div class="mana-display">
            <span class="mana-icon">✦</span>
            <span class="mana-value">{{ store.魔力信息.当前 }}</span>
            <span class="mana-max">/ {{ store.魔力信息.最大 }}</span>
          </div>
        </div>
        <div class="panel__content">
          <div class="spell-grid">
            <div
              v-for="法术 in 法术列表"
              :key="法术"
              class="spell-card"
              :class="{
                'spell-card--selected': 选中法术 === 法术,
                'spell-card--disabled': (store.游戏实例?.获取法术管理器().获取法术配置(法术)?.价格 ?? 0) > store.魔力信息.当前
              }"
              @click="选择法术(法术)"
            >
              <div class="spell-card__icon">{{ 获取法术图标(法术) }}</div>
              <div class="spell-card__info">
                <h4 class="spell-name">{{ 法术 }}</h4>
                <p class="spell-desc">
                  {{ store.游戏实例?.获取法术管理器().获取法术配置(法术)?.描述 }}
                </p>
              </div>
              <div class="spell-card__cost">
                <span class="cost-icon">✦</span>
                <span class="cost-value">
                  {{ store.游戏实例?.获取法术管理器().获取法术配置(法术)?.价格 }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="法术列表.length === 0" class="empty-state">
            <span class="empty-icon">✨</span>
            <p>暂无可用法术</p>
          </div>
        </div>
      </div>

      <!-- 右侧：施法配置 -->
      <div class="panel panel--elevated cast-section">
        <div class="panel__header">
          <h2 class="panel__title">施法配置</h2>
        </div>
        <div class="panel__content">
          <template v-if="选中法术 && 当前法术配置">
            <!-- 法术信息 -->
            <div class="cast-spell-info">
              <div class="cast-spell-header">
                <span class="cast-spell-icon">{{ 获取法术图标(选中法术) }}</span>
                <div class="cast-spell-title">
                  <h3>{{ 选中法术 }}</h3>
                  <span class="spell-type">{{ 当前法术配置.目标类型 === '无' ? '全体法术' : `目标: ${当前法术配置.目标类型}` }}</span>
                </div>
              </div>
              <p class="cast-spell-desc">{{ 当前法术配置.描述 }}</p>
              <div class="spell-effects" v-if="获取效果描述(当前法术配置)">
                <span class="effects-label">效果:</span>
                <span class="effects-value">{{ 获取效果描述(当前法术配置) }}</span>
              </div>
            </div>

            <!-- 倍率调节 -->
            <div class="multiplier-section">
              <h4 class="section-label">施法倍率</h4>
              <div class="multiplier-control">
                <button class="multiplier-btn" @click="减少倍率" :disabled="施法倍率 <= 1">−</button>
                <span class="multiplier-value">×{{ 施法倍率 }}</span>
                <button class="multiplier-btn" @click="增加倍率" :disabled="当前消耗 + 当前法术配置.价格 > store.魔力信息.当前">+</button>
              </div>
              <div class="cost-preview">
                <span class="cost-label">消耗魔力:</span>
                <span class="cost-amount" :class="{ 'cost-amount--insufficient': 当前消耗 > store.魔力信息.当前 }">
                  <span class="cost-icon">✦</span>
                  {{ 当前消耗 }}
                </span>
              </div>
            </div>

            <!-- 目标选择 -->
            <div class="target-section" v-if="需要目标">
              <h4 class="section-label">选择目标</h4>
              <div class="target-grid">
                <div
                  v-for="target in 目标选项"
                  :key="target.id"
                  class="target-option"
                  :class="{ 'target-option--selected': 选中目标ID === target.id }"
                  @click="选中目标ID = target.id"
                >
                  <span class="target-icon">{{ target.图标 }}</span>
                  <div class="target-info">
                    <span class="target-name">{{ target.名称 }}</span>
                    <span class="target-desc">{{ target.描述 }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 施法按钮 -->
            <button
              class="btn btn--accent btn--lg btn--block cast-btn"
              :disabled="!可以施法"
              @click="施放法术"
            >
              <span class="btn-icon">✨</span>
              施放法术
            </button>
          </template>

          <div v-else class="empty-cast">
            <span class="empty-icon">✨</span>
            <p>选择法术以配置施法</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.spell-panel {
  height: 100%;
}

.spell-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: $spacing-lg;
  height: 100%;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

.spell-list-section,
.cast-section {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 180px);
  overflow: hidden;

  .panel__content {
    flex: 1;
    overflow-y: auto;
  }
}

.mana-display {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-md;
  background: rgba($color-accent, 0.15);
  border: 1px solid $color-accent;
  border-radius: $radius-sm;

  .mana-icon {
    font-size: $font-size-lg;
    color: $color-accent;
  }

  .mana-value {
    font-size: $font-size-lg;
    font-weight: 700;
    color: $color-accent;
  }

  .mana-max {
    font-size: $font-size-sm;
    color: $text-muted;
  }
}

.spell-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: $spacing-md;
}

.spell-card {
  display: flex;
  align-items: flex-start;
  gap: $spacing-md;
  padding: $spacing-lg;
  background: $bg-medium;
  border: 1px solid $border-medium;
  border-radius: $radius-md;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover:not(.spell-card--disabled) {
    border-color: $color-primary;
    transform: translateY(-2px);
  }

  &--selected {
    border-color: $color-accent;
    background: rgba($color-accent, 0.1);
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &__icon {
    width: 48px;
    height: 48px;
    background: $bg-light;
    border: 2px solid $color-accent;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: $font-size-2xl;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__cost {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-xs $spacing-sm;
    background: $bg-light;
    border-radius: $radius-sm;

    .cost-icon {
      color: $color-accent;
    }

    .cost-value {
      font-weight: 600;
      color: $text-primary;
    }
  }
}

.spell-name {
  font-size: $font-size-base;
  font-weight: 600;
  color: $text-highlight;
  margin: 0 0 $spacing-xs;
}

.spell-desc {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin: 0;
  line-height: $line-height-loose;
}

// 施法配置区
.cast-spell-info {
  margin-bottom: $spacing-xl;
}

.cast-spell-header {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  margin-bottom: $spacing-md;
}

.cast-spell-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, $color-accent-dark, $color-accent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-3xl;
}

.cast-spell-title {
  h3 {
    font-size: $font-size-xl;
    font-weight: 700;
    color: $text-highlight;
    margin: 0 0 $spacing-xs;
  }

  .spell-type {
    font-size: $font-size-sm;
    color: $text-muted;
  }
}

.cast-spell-desc {
  font-size: $font-size-base;
  color: $text-secondary;
  line-height: $line-height-loose;
  margin: 0 0 $spacing-md;
}

.spell-effects {
  padding: $spacing-sm $spacing-md;
  background: rgba($color-success, 0.1);
  border: 1px solid $color-success;
  border-radius: $radius-sm;
  font-size: $font-size-sm;

  .effects-label {
    color: $text-muted;
    margin-right: $spacing-sm;
  }

  .effects-value {
    color: $color-success;
    font-weight: 500;
  }
}

// 倍率控制
.multiplier-section {
  margin-bottom: $spacing-xl;
  padding: $spacing-lg;
  background: $bg-medium;
  border-radius: $radius-md;
}

.section-label {
  font-size: $font-size-sm;
  color: $text-muted;
  margin: 0 0 $spacing-md;
}

.multiplier-control {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-lg;
  margin-bottom: $spacing-md;
}

.multiplier-btn {
  width: 40px;
  height: 40px;
  background: $bg-light;
  border: 1px solid $border-medium;
  border-radius: 50%;
  font-size: $font-size-xl;
  font-weight: 700;
  color: $text-primary;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover:not(:disabled) {
    border-color: $color-primary;
    background: rgba($color-primary, 0.1);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.multiplier-value {
  font-size: $font-size-2xl;
  font-weight: 700;
  color: $color-accent;
  min-width: 60px;
  text-align: center;
}

.cost-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
}

.cost-label {
  font-size: $font-size-sm;
  color: $text-muted;
}

.cost-amount {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: $font-size-lg;
  font-weight: 600;
  color: $color-accent;

  &--insufficient {
    color: $color-danger;
  }

  .cost-icon {
    font-size: $font-size-base;
  }
}

// 目标选择
.target-section {
  margin-bottom: $spacing-xl;
}

.target-grid {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  max-height: 200px;
  overflow-y: auto;
}

.target-option {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $bg-medium;
  border: 1px solid $border-dark;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    border-color: $color-primary;
  }

  &--selected {
    border-color: $color-accent;
    background: rgba($color-accent, 0.1);
  }

  .target-icon {
    font-size: $font-size-xl;
  }

  .target-info {
    flex: 1;
  }

  .target-name {
    display: block;
    font-weight: 500;
    color: $text-primary;
  }

  .target-desc {
    font-size: $font-size-xs;
    color: $text-muted;
  }
}

.cast-btn {
  .btn-icon {
    font-size: $font-size-lg;
  }
}

.empty-state,
.empty-cast {
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
}
</style>
