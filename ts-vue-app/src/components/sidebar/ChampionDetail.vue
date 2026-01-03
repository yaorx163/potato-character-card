<!-- components/sidebar/ChampionDetail.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import type { 冠军实体 } from '@/core/entities';
import ProgressRing from '@/components/common/ProgressRing.vue';

const props = defineProps<{
  champion: 冠军实体;
}>();

const 喽啰信息 = computed(() => {
  const 喽啰池 = props.champion.获取喽啰池();
  if (!喽啰池) return null;

  return {
    总数: 喽啰池.获取总数量(),
    最大: props.champion.计算可统帅喽啰数(),
    战斗力: 喽啰池.获取战斗力(),
    分布: 喽啰池.获取分组详情()
  };
});

const 属性列表 = computed(() => [
  { 名称: '力量', 值: props.champion.获取属性('力量'), 图标: '💪' },
  { 名称: '敏捷', 值: props.champion.获取属性('敏捷'), 图标: '🏃' },
  { 名称: '智力', 值: props.champion.获取属性('智力'), 图标: '🧠' },
  { 名称: '魅力', 值: props.champion.获取属性('魅力'), 图标: '✨' },
  { 名称: '统御力', 值: props.champion.获取属性('统御力'), 图标: '👑' },
]);
</script>

<template>
  <div class="champion-detail">
    <!-- 基本信息 -->
    <section class="detail-section">
      <div class="champion-header">
        <div class="champion-avatar">👺</div>
        <div class="champion-basic">
          <h2 class="champion-name">{{ champion.获取属性('姓名') }}</h2>
          <div class="champion-meta">
            <span class="meta-item">来源: {{ champion.获取属性('来源') || '未知' }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 属性 -->
    <section class="detail-section">
      <h3 class="section-title">属性</h3>
      <div class="attributes-grid">
        <div v-for="attr in 属性列表" :key="attr.名称" class="attribute-item">
          <span class="attr-icon">{{ attr.图标 }}</span>
          <span class="attr-name">{{ attr.名称 }}</span>
          <div class="attr-bar">
            <div class="attr-fill" :style="{ width: `${attr.值}%` }"></div>
          </div>
          <span class="attr-value">{{ attr.值 }}</span>
        </div>
      </div>
    </section>

    <!-- 喽啰信息 -->
    <section class="detail-section" v-if="喽啰信息">
      <h3 class="section-title">喽啰军团</h3>
      <div class="minion-overview">
        <ProgressRing
          :value="喽啰信息.总数"
          :max="喽啰信息.最大"
          :size="80"
          :stroke-width="8"
          color="primary"
        >
          <div class="minion-count">
            <span class="count-current">{{ 喽啰信息.总数 }}</span>
            <span class="count-max">/{{ 喽啰信息.最大 }}</span>
          </div>
        </ProgressRing>
        <div class="minion-stats">
          <div class="stat-row">
            <span class="stat-label">总战斗力</span>
            <span class="stat-value">{{ Math.round(喽啰信息.战斗力) }}</span>
          </div>
          <div class="stat-row" v-for="(数量, 类型) in 喽啰信息.分布" :key="类型">
            <span class="stat-label">{{ 类型 }}</span>
            <span class="stat-value">{{ 数量 }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 操作按钮 -->
    <div class="detail-actions">
      <button class="btn btn--primary btn--block">派遣任务</button>
      <button class="btn btn--ghost btn--block">调整喽啰</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.champion-detail {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.detail-section {
  padding-bottom: $spacing-lg;
  border-bottom: 1px solid $border-dark;

  &:last-of-type {
    border-bottom: none;
  }
}

.section-title {
  font-size: $font-size-sm;
  font-weight: 600;
  color: $text-muted;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 $spacing-md;
}

.champion-header {
  display: flex;
  align-items: center;
  gap: $spacing-lg;
}

.champion-avatar {
  width: 72px;
  height: 72px;
  background: $bg-light;
  border: 3px solid $color-primary;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
}

.champion-basic {
  flex: 1;
}

.champion-name {
  font-size: $font-size-xl;
  font-weight: 700;
  color: $text-highlight;
  margin: 0 0 $spacing-xs;
}

.champion-meta {
  font-size: $font-size-sm;
  color: $text-muted;
}

.attributes-grid {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.attribute-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  .attr-icon {
    width: 24px;
    text-align: center;
  }

  .attr-name {
    width: 48px;
    font-size: $font-size-sm;
    color: $text-secondary;
  }

  .attr-bar {
    flex: 1;
    height: 8px;
    background: $bg-light;
    border-radius: 4px;
    overflow: hidden;

    .attr-fill {
      height: 100%;
      background: linear-gradient(90deg, $color-primary-dark, $color-primary);
      border-radius: 4px;
    }
  }

  .attr-value {
    width: 32px;
    text-align: right;
    font-weight: 600;
    color: $text-primary;
  }
}

.minion-overview {
  display: flex;
  align-items: flex-start;
  gap: $spacing-lg;
}

.minion-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;

  .count-current {
    font-size: $font-size-lg;
    font-weight: 700;
    color: $text-primary;
  }

  .count-max {
    font-size: $font-size-xs;
    color: $text-muted;
  }
}

.minion-stats {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: $spacing-xs 0;
  border-bottom: 1px solid $border-dark;

  &:last-child {
    border-bottom: none;
  }

  .stat-label {
    font-size: $font-size-sm;
    color: $text-secondary;
  }

  .stat-value {
    font-size: $font-size-sm;
    font-weight: 600;
    color: $text-primary;
  }
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.skill-item {
  padding: $spacing-sm $spacing-md;
  background: $bg-medium;
  border-radius: $radius-sm;

  .skill-name {
    display: block;
    font-weight: 500;
    color: $text-primary;
    margin-bottom: $spacing-xs;
  }

  .skill-desc {
    font-size: $font-size-sm;
    color: $text-muted;
  }
}

.detail-actions {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  margin-top: auto;
  padding-top: $spacing-lg;
}
</style>
