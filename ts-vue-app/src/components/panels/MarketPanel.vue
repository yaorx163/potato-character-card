<!-- components/panels/MarketPanel.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGameStore } from '../../stores/gameStore';

const store = useGameStore();

type TabType = 'goods' | 'slaves';
const currentTab = ref<TabType>('goods');

// 商品列表
const 商品列表 = computed(() => {
  return store.游戏实例?.获取黑市管理器().获取所有商品名() ?? [];
});

// 奴隶列表
const 奴隶列表 = computed(() => {
  return store.游戏实例?.获取黑市管理器().获取奴隶货架() ?? [];
});

// 购买状态
const 选中商品 = ref<string | null>(null);
const 购买数量 = ref(1);
const 选中目标ID = ref<string | null>(null);
const 选中奴隶ID = ref<string | null>(null);

// 当前商品配置
const 当前商品配置 = computed(() => {
  if (!选中商品.value) return null;
  return store.游戏实例?.获取黑市管理器().获取商品配置(选中商品.value) ?? null;
});

// 计算总价
const 总价格 = computed(() => {
  if (!当前商品配置.value) return 0;
  return 当前商品配置.value.价格 * 购买数量.value;
});

// 是否需要目标
const 需要目标 = computed(() => {
  if (!当前商品配置.value) return false;
  return 当前商品配置.value.目标类型 !== '无';
});

// 目标选项
const 目标选项 = computed(() => {
  if (!当前商品配置.value) return [];

  const 目标类型 = 当前商品配置.value.目标类型;

  switch (目标类型) {
    case '母畜实体':
      return store.所有母畜.map(b => ({
        id: b.实体ID,
        名称: b.获取属性('姓名'),
        描述: `${b.获取属性('种族')}`,
        图标: '👩'
      }));
    case '冠军实体':
      return store.所有冠军.map(c => ({
        id: c.实体ID,
        名称: c.获取属性('姓名'),
        描述: `喽啰 ${c.获取喽啰池()?.获取总数量() ?? 0}`,
        图标: '👺'
      }));
    default:
      return [];
  }
});

// 是否可以购买商品
const 可以购买商品 = computed(() => {
  if (!选中商品.value || !当前商品配置.value) return false;
  if (总价格.value > store.资源状态.催淫母乳) return false;
  if (需要目标.value && !选中目标ID.value) return false;
  return true;
});

// 选中的奴隶详情
const 选中的奴隶 = computed(() => {
  if (!选中奴隶ID.value) return null;
  return 奴隶列表.value.find(s => s.商品ID === 选中奴隶ID.value);
});

// 是否可以购买奴隶
const 可以购买奴隶 = computed(() => {
  if (!选中的奴隶.value) return false;
  return 选中的奴隶.value.价格 <= store.资源状态.催淫母乳;
});

// 方法
function 选择商品(商品名: string) {
  选中商品.value = 商品名;
  购买数量.value = 1;
  选中目标ID.value = null;
}

function 增加数量() {
  const 新总价 = 总价格.value + (当前商品配置.value?.价格 ?? 0);
  if (新总价 <= store.资源状态.催淫母乳) {
    购买数量.value++;
  }
}

function 减少数量() {
  if (购买数量.value > 1) {
    购买数量.value--;
  }
}

function 购买商品() {
  if (!可以购买商品.value || !选中商品.value) return;

  const 结果 = store.购买商品(选中商品.value, 购买数量.value, 选中目标ID.value ?? undefined);

  if (结果.成功) {
    选中商品.value = null;
    购买数量.value = 1;
    选中目标ID.value = null;
  }
}

function 购买奴隶() {
  if (!可以购买奴隶.value || !选中奴隶ID.value) return;

  const 结果 = store.购买奴隶(选中奴隶ID.value);

  if (结果.成功) {
    选中奴隶ID.value = null;
  }
}

// 获取商品图标
function 获取商品图标(类型: string): string {
  const 图标映射: Record<string, string> = {
    '消耗品': '🧪',
    '装备': '⚔️',
    '道具': '📦',
    '材料': '🔮',
  };
  return 图标映射[类型] ?? '📦';
}

// 获取稀有度颜色
function 获取稀有度颜色(稀有度: string): string {
  const 颜色映射: Record<string, string> = {
    '普通': 'primary',
    '稀有': 'accent',
    '史诗': 'warning',
    '传说': 'danger',
  };
  return 颜色映射[稀有度] ?? 'primary';
}
</script>

<template>
  <div class="market-panel">
    <div class="panel panel--elevated">
      <div class="panel__header">
        <h2 class="panel__title">黑市交易</h2>
        <div class="currency-display">
          <span class="currency-icon">🍼</span>
          <span class="currency-value">{{ store.资源状态.催淫母乳 }}</span>
          <span class="currency-label">催淫母乳</span>
        </div>
      </div>

      <!-- 标签切换 -->
      <div class="tab-nav">
        <button
          class="tab-btn"
          :class="{ 'tab-btn--active': currentTab === 'goods' }"
          @click="currentTab = 'goods'; 选中奴隶ID = null"
        >
          <span class="tab-btn__icon">📦</span>
          <span class="tab-btn__label">商品</span>
          <span class="tab-btn__count">{{ 商品列表.length }}</span>
        </button>
        <button
          class="tab-btn"
          :class="{ 'tab-btn--active': currentTab === 'slaves' }"
          @click="currentTab = 'slaves'; 选中商品 = null"
        >
          <span class="tab-btn__icon">👩</span>
          <span class="tab-btn__label">奴隶</span>
          <span class="tab-btn__count">{{ 奴隶列表.length }}</span>
        </button>
      </div>

      <div class="market-layout">
        <!-- 商品/奴隶列表 -->
        <div class="list-section">
          <Transition name="fade" mode="out-in">
            <!-- 商品列表 -->
            <div v-if="currentTab === 'goods'" key="goods" class="goods-grid">
              <div
                v-for="商品名 in 商品列表"
                :key="商品名"
                class="goods-card"
                :class="{ 'goods-card--selected': 选中商品 === 商品名 }"
                @click="选择商品(商品名)"
              >
                <div class="goods-card__icon">
                  {{ 获取商品图标(store.游戏实例?.获取黑市管理器().获取商品配置(商品名)?.类型 ?? '') }}
                </div>
                <div class="goods-card__info">
                  <h4 class="goods-name">{{ 商品名 }}</h4>
                  <p class="goods-desc">
                    {{ store.游戏实例?.获取黑市管理器().获取商品配置(商品名)?.描述 }}
                  </p>
                </div>
                <div class="goods-card__price">
                  <span class="price-icon">🍼</span>
                  <span class="price-value">
                    {{ store.游戏实例?.获取黑市管理器().获取商品配置(商品名)?.价格 }}
                  </span>
                </div>
              </div>

              <div v-if="商品列表.length === 0" class="empty-state">
                <span class="empty-icon">📦</span>
                <p>暂无商品</p>
              </div>
            </div>

            <!-- 奴隶列表 -->
            <div v-else-if="currentTab === 'slaves'" key="slaves" class="slaves-grid">
              <div
                v-for="slave in 奴隶列表"
                :key="slave.商品ID"
                class="slave-card"
                :class="{
                  'slave-card--selected': 选中奴隶ID === slave.商品ID,
                  'slave-card--unaffordable': slave.价格 > store.资源状态.催淫母乳
                }"
                @click="选中奴隶ID = slave.商品ID"
              >
                <div class="slave-card__avatar">👩</div>
                <div class="slave-card__info">
                  <h4 class="slave-name">{{ slave.母畜实体.获取属性('姓名') }}</h4>
                  <div class="slave-tags">
                    <span class="tag tag--race">{{ slave.母畜实体.获取属性('种族') }}</span>
                    <span class="tag tag--identity">{{ slave.母畜实体.获取属性('原身份') }}</span>
                  </div>
                  <div class="slave-stats">
                    <span class="stat">魅力 {{ slave.母畜实体.获取属性('魅力') }}</span>
                    <span class="stat">生育力 {{ slave.母畜实体.获取属性('生育力') }}</span>
                    <span class="stat">年龄 {{ slave.母畜实体.获取属性('年龄') }}</span>
                  </div>
                </div>
                <div class="slave-card__price">
                  <span class="price-icon">🍼</span>
                  <span class="price-value">{{ slave.母畜实体.获取属性('价格') }}</span>
                </div>
              </div>

              <div v-if="奴隶列表.length === 0" class="empty-state">
                <span class="empty-icon">👩</span>
                <p>暂无待售奴隶</p>
                <p class="empty-hint">每回合刷新</p>
              </div>
            </div>
          </Transition>
        </div>

        <!-- 购买配置 -->
        <div class="purchase-section">
          <!-- 商品购买配置 -->
          <div v-if="currentTab === 'goods' && 选中商品 && 当前商品配置" class="purchase-config">
            <div class="config-header">
              <span class="config-icon">{{ 获取商品图标(当前商品配置.类型) }}</span>
              <div class="config-title">
                <h3>{{ 选中商品 }}</h3>
                <span class="config-type">{{ 当前商品配置.类型 }}</span>
              </div>
            </div>

            <p class="config-desc">{{ 当前商品配置.描述 }}</p>

            <!-- 数量控制 -->
            <div class="quantity-control">
              <h4>购买数量</h4>
              <div class="quantity-input">
                <button class="quantity-btn" @click="减少数量" :disabled="购买数量 <= 1">−</button>
                <span class="quantity-value">{{ 购买数量 }}</span>
                <button class="quantity-btn" @click="增加数量" :disabled="总价格 + 当前商品配置.价格 > store.资源状态.催淫母乳">+</button>
              </div>
            </div>

            <!-- 目标选择 -->
            <div class="target-select" v-if="需要目标">
              <h4>选择目标</h4>
              <div class="target-list">
                <div
                  v-for="target in 目标选项"
                  :key="target.id"
                  class="target-item"
                  :class="{ 'target-item--selected': 选中目标ID === target.id }"
                  @click="选中目标ID = target.id"
                >
                  <span class="target-icon">{{ target.图标 }}</span>
                  <span class="target-name">{{ target.名称 }}</span>
                  <span class="target-desc">{{ target.描述 }}</span>
                </div>
              </div>
            </div>

            <!-- 总价和购买 -->
            <div class="purchase-footer">
              <div class="total-price">
                <span class="total-label">总价:</span>
                <span class="total-value" :class="{ 'total-value--insufficient': 总价格 > store.资源状态.催淫母乳 }">
                  <span class="price-icon">🍼</span>
                  {{ 总价格 }}
                </span>
              </div>
              <button
                class="btn btn--accent btn--lg btn--block"
                :disabled="!可以购买商品"
                @click="购买商品"
              >
                确认购买
              </button>
            </div>
          </div>

          <!-- 奴隶购买配置 -->
          <div v-else-if="currentTab === 'slaves' && 选中的奴隶" class="purchase-config">
            <div class="slave-detail">
              <div class="slave-portrait">👩</div>
              <h3 class="slave-detail-name">{{ 选中的奴隶.母畜实体.获取属性('姓名') }}</h3>
              <div class="slave-detail-tags">
                <span class="tag tag--race">{{ 选中的奴隶.母畜实体.获取属性('种族') }}</span>
                <span class="tag tag--identity">{{ 选中的奴隶.母畜实体.获取属性('原身份') }}</span>
              </div>
            </div>

            <div class="slave-attributes">
              <div class="attr-row">
                <span class="attr-label">年龄</span>
                <span class="attr-value">{{ 选中的奴隶.母畜实体.获取属性('年龄') }}岁</span>
              </div>
              <div class="attr-row">
                <span class="attr-label">魅力</span>
                <div class="attr-bar">
                  <div class="attr-fill" :style="{ width: `${选中的奴隶.母畜实体.获取属性('魅力') }%` }"></div>
                </div>
                <span class="attr-value">{{ 选中的奴隶.母畜实体.获取属性('魅力') }}</span>
              </div>
              <div class="attr-row">
                <span class="attr-label">生育力</span>
                <div class="attr-bar">
                  <div class="attr-fill attr-fill--accent" :style="{ width: `${选中的奴隶.母畜实体.获取属性('生育力') }%` }"></div>
                </div>
                <span class="attr-value">{{ 选中的奴隶.母畜实体.获取属性('生育力') }}</span>
              </div>
              <div class="attr-row" v-if="选中的奴隶.母畜实体.特性列表.size > 0">
                <span class="attr-label">特性列表</span>
                <span class="attr-value attr-value--special">{{ 选中的奴隶.母畜实体.特性列表 }}</span>
              </div>
            </div>

            <div class="purchase-footer">
              <div class="total-price">
                <span class="total-label">价格:</span>
                <span class="total-value" :class="{ 'total-value--insufficient': 选中的奴隶.价格 > store.资源状态.催淫母乳 }">
                  <span class="price-icon">🍼</span>
                  {{ 选中的奴隶.价格 }}
                </span>
              </div>
              <button
                class="btn btn--accent btn--lg btn--block"
                :disabled="!可以购买奴隶"
                @click="购买奴隶"
              >
                购买奴隶
              </button>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="empty-purchase">
            <span class="empty-icon">🛒</span>
            <p>选择商品或奴隶查看详情</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '../../styles/variables' as *;

.market-panel {
  height: 100%;
}

.currency-display {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-lg;
  background: rgba($color-primary, 0.15);
  border: 1px solid $color-primary;
  border-radius: $radius-sm;

  .currency-icon {
    font-size: $font-size-xl;
  }

  .currency-value {
    font-size: $font-size-xl;
    font-weight: 700;
    color: $color-primary-light;
  }

  .currency-label {
    font-size: $font-size-sm;
    color: $text-muted;
  }
}

.tab-nav {
  display: flex;
  gap: $spacing-sm;
  padding: 0 $spacing-lg;
  margin-bottom: $spacing-lg;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-lg;
  background: transparent;
  border: 1px solid $border-medium;
  border-radius: $radius-sm;
  color: $text-secondary;
  cursor: pointer;
  transition: all $transition-fast;
  font-family: $font-family-ui;

  &:hover {
    border-color: $color-primary;
    color: $text-primary;
  }

  &--active {
    background: rgba($color-primary, 0.15);
    border-color: $color-primary;
    color: $text-highlight;
  }

  &__icon {
    font-size: $font-size-lg;
  }

  &__label {
    font-size: $font-size-sm;
    font-weight: 500;
  }

  &__count {
    min-width: 24px;
    height: 24px;
    padding: 0 $spacing-sm;
    background: $bg-light;
    border-radius: 12px;
    font-size: $font-size-xs;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.market-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: $spacing-lg;
  padding: 0 $spacing-lg $spacing-lg;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

.list-section {
  max-height: calc(100vh - 320px);
  overflow-y: auto;
}

// 商品网格
.goods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: $spacing-md;
}

.goods-card {
  display: flex;
  align-items: flex-start;
  gap: $spacing-md;
  padding: $spacing-lg;
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
  }

  &__icon {
    width: 48px;
    height: 48px;
    background: $bg-light;
    border: 2px solid $border-light;
    border-radius: $radius-md;
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

  &__price {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-xs $spacing-sm;
    background: $bg-light;
    border-radius: $radius-sm;

    .price-icon {
      font-size: $font-size-sm;
    }

    .price-value {
      font-weight: 600;
      color: $color-primary-light;
    }
  }
}

.goods-name {
  font-size: $font-size-base;
  font-weight: 600;
  color: $text-highlight;
  margin: 0 0 $spacing-xs;
}

.goods-desc {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin: 0;
}

// 奴隶网格
.slaves-grid {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.slave-card {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-lg;
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
  }

  &--unaffordable {
    opacity: 0.6;
  }

  &__avatar {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #ffd1dc 0%, #ffb6c1 100%);
    border: 2px solid $border-light;
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

  &__price {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-sm $spacing-md;
    background: $bg-light;
    border-radius: $radius-sm;

    .price-icon {
      font-size: $font-size-lg;
    }

    .price-value {
      font-size: $font-size-lg;
      font-weight: 700;
      color: $color-primary-light;
    }
  }
}

.slave-name {
  font-size: $font-size-base;
  font-weight: 600;
  color: $text-highlight;
  margin: 0 0 $spacing-xs;
}

.slave-tags {
  display: flex;
  gap: $spacing-xs;
  margin-bottom: $spacing-sm;
}

.tag {
  padding: 2px $spacing-sm;
  border-radius: $radius-sm;
  font-size: $font-size-xs;

  &--race {
    background: rgba($color-info, 0.2);
    color: lighten($color-info, 20%);
  }

  &--identity {
    background: rgba($color-primary, 0.2);
    color: $color-primary-light;
  }
}

.slave-stats {
  display: flex;
  gap: $spacing-md;
  font-size: $font-size-sm;
  color: $text-muted;

  .stat {
    &::after {
      content: '·';
      margin-left: $spacing-md;
      color: $border-light;
    }

    &:last-child::after {
      display: none;
    }
  }
}

// 购买配置区
.purchase-section {
  background: $bg-medium;
  border: 1px solid $border-dark;
  border-radius: $radius-md;
  padding: $spacing-lg;
  max-height: calc(100vh - 320px);
  overflow-y: auto;
}

.purchase-config {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.config-header {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.config-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, $color-accent-dark, $color-accent);
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-2xl;
}

.config-title {
  h3 {
    font-size: $font-size-xl;
    font-weight: 700;
    color: $text-highlight;
    margin: 0 0 $spacing-xs;
  }

  .config-type {
    font-size: $font-size-sm;
    color: $text-muted;
  }
}

.config-desc {
  font-size: $font-size-base;
  color: $text-secondary;
  line-height: $line-height-loose;
  margin: 0;
}

.effect-preview {
  padding: $spacing-md;
  background: rgba($color-success, 0.1);
  border: 1px solid $color-success;
  border-radius: $radius-sm;

  h4 {
    font-size: $font-size-sm;
    color: $text-muted;
    margin: 0 0 $spacing-sm;
  }
}

.effect-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.effect-item {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  background: $bg-dark;
  border-radius: $radius-sm;

  .effect-name {
    font-size: $font-size-sm;
    color: $text-secondary;
  }

  .effect-value {
    font-size: $font-size-sm;
    font-weight: 600;
    color: $color-success;
  }
}

.quantity-control {
  h4 {
    font-size: $font-size-sm;
    color: $text-muted;
    margin: 0 0 $spacing-sm;
  }
}

.quantity-input {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-lg;
}

.quantity-btn {
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
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.quantity-value {
  font-size: $font-size-2xl;
  font-weight: 700;
  color: $text-highlight;
  min-width: 40px;
  text-align: center;
}

.target-select {
  h4 {
    font-size: $font-size-sm;
    color: $text-muted;
    margin: 0 0 $spacing-sm;
  }
}

.target-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  max-height: 150px;
  overflow-y: auto;
}

.target-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  background: $bg-dark;
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
    font-size: $font-size-lg;
  }

  .target-name {
    flex: 1;
    font-weight: 500;
    color: $text-primary;
  }

  .target-desc {
    font-size: $font-size-xs;
    color: $text-muted;
  }
}

.purchase-footer {
  margin-top: auto;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-dark;
}

.total-price {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-md;
  margin-bottom: $spacing-md;

  .total-label {
    font-size: $font-size-base;
    color: $text-muted;
  }

  .total-value {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-2xl;
    font-weight: 700;
    color: $color-primary-light;

    &--insufficient {
      color: $color-danger;
    }

    .price-icon {
      font-size: $font-size-lg;
    }
  }
}

// 奴隶详情
.slave-detail {
  text-align: center;
  padding-bottom: $spacing-lg;
  border-bottom: 1px solid $border-dark;
}

.slave-portrait {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #ffd1dc 0%, #ffb6c1 100%);
  border: 3px solid $border-light;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  margin: 0 auto $spacing-md;
}

.slave-detail-name {
  font-size: $font-size-xl;
  font-weight: 700;
  color: $text-highlight;
  margin: 0 0 $spacing-sm;
}

.slave-detail-tags {
  display: flex;
  justify-content: center;
  gap: $spacing-sm;
}

.slave-attributes {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.attr-row {
  display: flex;
  align-items: center;
  gap: $spacing-md;

  .attr-label {
    width: 60px;
    font-size: $font-size-sm;
    color: $text-muted;
  }

  .attr-bar {
    flex: 1;
    height: 8px;
    background: $bg-light;
    border-radius: 4px;
    overflow: hidden;
  }

  .attr-fill {
    height: 100%;
    background: $color-primary;
    border-radius: 4px;

    &--accent {
      background: $color-accent;
    }
  }

  .attr-value {
    min-width: 40px;
    text-align: right;
    font-weight: 600;
    color: $text-primary;

    &--special {
      color: $color-accent;
    }
  }
}

.empty-state,
.empty-purchase {
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity $transition-fast;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
