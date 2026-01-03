<!-- components/sidebar/BreederDetail.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import type { 母畜实体 } from '@/core/entities';

const props = defineProps<{
  breeder: 母畜实体;
}>();

function getStatusColor(value: number): string {
  if (value >= 80) return 'success';
  if (value >= 50) return 'warning';
  return 'danger';
}
</script>

<template>
  <div class="breeder-detail">
    <!-- 基本信息 -->
    <section class="detail-section">
      <div class="breeder-header">
        <div class="breeder-avatar">👩</div>
        <div class="breeder-basic">
          <h2 class="breeder-name">{{ breeder.获取属性('姓名') }}</h2>
          <div class="breeder-tags">
            <span class="tag tag--race">{{ breeder.获取属性('种族') }}</span>
            <span class="tag tag--identity">{{ breeder.获取属性('原身份') }}</span>
          </div>
          <div class="breeder-meta">
            <span>{{ breeder.获取属性('年龄') }}岁</span>
            <span>·</span>
            <span>魅力 {{ breeder.获取属性('魅力') }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 状态 -->
    <section class="detail-section">
      <h3 class="section-title">状态</h3>
      <div class="status-bars">
        <div class="status-item">
          <div class="status-header">
            <span class="status-label">臣服度</span>
            <span class="status-value" :class="`status-value--${getStatusColor(breeder.获取属性('臣服度'))}`">
              {{ breeder.获取属性('臣服度') }}%
            </span>
          </div>
          <div class="status-bar">
            <div
              class="status-fill status-fill--success"
              :style="{ width: `${breeder.获取属性('臣服度')}%` }"
            ></div>
          </div>
        </div>

        <div class="status-item">
          <div class="status-header">
            <span class="status-label">淫乱度</span>
            <span class="status-value">{{ breeder.获取属性('淫乱度') }}%</span>
          </div>
          <div class="status-bar">
            <div
              class="status-fill status-fill--danger"
              :style="{ width: `${breeder.获取属性('淫乱度')}%` }"
            ></div>
          </div>
        </div>

        <div class="status-item">
          <div class="status-header">
            <span class="status-label">生育力</span>
            <span class="status-value">
              {{ breeder.获取属性('剩余生育力') }} / {{ breeder.获取属性('总生育力') }}
            </span>
          </div>
          <div class="status-bar">
            <div
              class="status-fill status-fill--accent"
              :style="{ width: `${(breeder.获取属性('剩余生育力') / breeder.获取属性('总生育力')) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
    </section>

    <!-- 生育记录 -->
    <section class="detail-section">
      <h3 class="section-title">生育记录</h3>
      <div class="birth-stats">
        <div class="birth-stat">
          <span class="birth-icon">👺</span>
          <span class="birth-value">{{ breeder.冠军生育记录.length }}</span>
          <span class="birth-label">冠军</span>
        </div>
        <div class="birth-stat">
          <span class="birth-icon">👥</span>
          <span class="birth-value">{{ breeder.喽啰生育记录 }}</span>
          <span class="birth-label">喽啰</span>
        </div>
      </div>

      <div v-if="breeder.冠军生育记录.length > 0" class="champion-list">
        <div v-for="记录 in breeder.冠军生育记录" :key="记录.获取属性('姓名')" class="champion-record">
          <span class="record-icon">👺</span>
          <span class="record-name">{{ 记录.获取属性('姓名') }}...</span>
          <span class="record-turn">由 {{ 记录.生母?.获取属性('姓名') }} 产出</span>
        </div>
      </div>
    </section>

    <!-- 特殊能力 -->
    <section class="detail-section" v-if="breeder.获取属性('特殊能力')">
      <h3 class="section-title">特殊能力</h3>
      <div class="ability-card">
        <span class="ability-icon">✨</span>
        <span class="ability-name">{{ breeder.获取属性('特殊能力') }}</span>
      </div>
    </section>

    <!-- 操作按钮 -->
    <div class="detail-actions">
      <button class="btn btn--primary btn--block">调教</button>
      <button class="btn btn--accent btn--block">繁殖</button>
      <button class="btn btn--ghost btn--block">劝慰</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.breeder-detail {
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

.breeder-header {
  display: flex;
  align-items: flex-start;
  gap: $spacing-lg;
}

.breeder-avatar {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #ffd1dc 0%, #ffb6c1 100%);
  border: 3px solid $border-light;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
}

.breeder-basic {
  flex: 1;
}

.breeder-name {
  font-size: $font-size-xl;
  font-weight: 700;
  color: $text-highlight;
  margin: 0 0 $spacing-sm;
}

.breeder-tags {
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

.breeder-meta {
  font-size: $font-size-sm;
  color: $text-muted;
  display: flex;
  gap: $spacing-sm;
}

.status-bars {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.status-item {
  .status-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: $spacing-xs;

    .status-label {
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .status-value {
      font-size: $font-size-sm;
      font-weight: 600;

      &--success { color: $color-success; }
      &--warning { color: $color-warning; }
      &--danger { color: $color-danger; }
    }
  }

  .status-bar {
    height: 8px;
    background: $bg-light;
    border-radius: 4px;
    overflow: hidden;
  }

  .status-fill {
    height: 100%;
    border-radius: 4px;
    transition: width $transition-base;

    &--success { background: $color-success; }
    &--accent { background: $color-accent; }
    &--danger { background: $color-danger; }
  }
}

.birth-stats {
  display: flex;
  gap: $spacing-lg;
  margin-bottom: $spacing-md;
}

.birth-stat {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md;
  background: $bg-medium;
  border-radius: $radius-md;
  flex: 1;

  .birth-icon {
    font-size: $font-size-xl;
  }

  .birth-value {
    font-size: $font-size-xl;
    font-weight: 700;
    color: $text-highlight;
  }

  .birth-label {
    font-size: $font-size-sm;
    color: $text-muted;
  }
}

.champion-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  max-height: 120px;
  overflow-y: auto;
}

.champion-record {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  background: $bg-medium;
  border-radius: $radius-sm;
  font-size: $font-size-sm;

  .record-icon {
    font-size: $font-size-base;
  }

  .record-name {
    flex: 1;
    color: $text-primary;
  }

  .record-turn {
    color: $text-muted;
  }
}

.ability-card {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md;
  background: rgba($color-accent, 0.1);
  border: 1px solid $color-accent;
  border-radius: $radius-md;

  .ability-icon {
    font-size: $font-size-xl;
  }

  .ability-name {
    font-weight: 500;
    color: $color-accent;
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
