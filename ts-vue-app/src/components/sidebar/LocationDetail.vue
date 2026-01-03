<!-- components/sidebar/LocationDetail.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import type { 可袭击地点实体 } from '@/core/entities';
import ProgressRing from '@/components/common/ProgressRing.vue';

const props = defineProps<{
  location: 可袭击地点实体;
}>();

const 侦察百分比 = computed(() => {
  const max = props.location.获取侦查最大值();
  if (max === 0) return 0;
  return Math.round((props.location.获取侦察进度() / max) * 100);
});

function getScoutStatus():{ label: string; color: "success" | "warning" | "primary" | "accent" | "danger" | undefined } {
  if (侦察百分比.value >= 100) return { label: '完成', color: 'success' };
  if (侦察百分比.value >= 60) return { label: '情报充分', color: 'accent' };
  if (侦察百分比.value >= 30) return { label: '初步了解', color: 'warning' };
  return { label: '未知', color: 'danger' };
}
</script>

<template>
  <div class="location-detail">
    <!-- 基本信息 -->
    <section class="detail-section">
      <div class="location-header">
        <div class="location-icon-large">🏘️</div>
        <div class="location-basic">
          <h2 class="location-name">{{ location.地点名称 }}</h2>
          <span class="location-type">{{ location.地点类型 }}</span>
        </div>
      </div>
      <p class="location-desc">{{ location.描述 }}</p>
    </section>

    <!-- 侦察进度 -->
    <section class="detail-section">
      <h3 class="section-title">侦察情报</h3>
      <div class="scout-overview">
        <ProgressRing
          :value="location.获取侦察进度()"
          :max="location.获取侦查最大值()"
          :size="100"
          :stroke-width="10"
          :color="getScoutStatus().color"
        >
          <div class="scout-center">
            <span class="scout-percent">{{ 侦察百分比 }}%</span>
            <span class="scout-status" :class="`scout-status--${getScoutStatus().color}`">
              {{ getScoutStatus().label }}
            </span>
          </div>
        </ProgressRing>
        <div class="scout-details">
          <div class="scout-row">
            <span class="scout-label">侦察进度</span>
            <span class="scout-value">{{ location.获取侦察进度() }} / {{ location.获取侦查最大值() }}</span>
          </div>
          <div class="scout-row">
            <span class="scout-label">战力估值</span>
            <span class="scout-value">
              {{ location.获取战斗力估值() ? `≈${Math.round(location.获取战斗力估值()!)}` : '???' }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- 母畜情报 -->
    <section class="detail-section">
      <h3 class="section-title">母畜情报</h3>
      <div class="breeder-intel">
        <div class="intel-stat">
          <span class="intel-icon">👩</span>
          <div class="intel-info">
            <span class="intel-value">{{ location.获取已侦察母畜数量() }}</span>
            <span class="intel-label">已侦察</span>
          </div>
        </div>
        <div class="intel-stat">
          <span class="intel-icon">❓</span>
          <div class="intel-info">
            <span class="intel-value">{{ location.获取潜在母畜数量() }}</span>
            <span class="intel-label">未侦察</span>
          </div>
        </div>
      </div>

      <!-- 已侦察母畜列表 -->
      <div v-if="location.获取所有已侦察母畜?.()?.length > 0" class="known-breeders">
        <h4 class="sub-title">已知目标</h4>
        <div class="breeder-list">
          <div
            v-for="breeder in location.获取所有已侦察母畜()"
            :key="breeder.实体ID"
            class="breeder-item"
          >
            <span class="breeder-icon">👩</span>
            <div class="breeder-info">
              <span class="breeder-name">{{ breeder.获取属性('姓名')  }}</span>
              <span class="breeder-race">{{ breeder.获取属性('种族') }}</span>
            </div>
            <span class="breeder-charm">魅力 {{ breeder.获取属性('魅力') }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 操作按钮 -->
    <div class="detail-actions">
      <button class="btn btn--primary btn--block">派遣侦察</button>
      <button class="btn btn--accent btn--block" :disabled="侦察百分比 < 30">
        发起袭击
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.location-detail {
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

.sub-title {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin: $spacing-md 0 $spacing-sm;
}

.location-header {
  display: flex;
  align-items: center;
  gap: $spacing-lg;
  margin-bottom: $spacing-md;
}

.location-icon-large {
  width: 64px;
  height: 64px;
  background: $bg-light;
  border: 2px solid $border-light;
  border-radius: $radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.location-basic {
  flex: 1;
}

.location-name {
  font-size: $font-size-xl;
  font-weight: 700;
  color: $text-highlight;
  margin: 0 0 $spacing-xs;
}

.location-type {
  font-size: $font-size-sm;
  color: $text-muted;
  padding: 2px $spacing-sm;
  background: $bg-light;
  border-radius: $radius-sm;
}

.location-desc {
  font-size: $font-size-base;
  color: $text-secondary;
  line-height: $line-height-loose;
  margin: 0;
}

.scout-overview {
  display: flex;
  align-items: center;
  gap: $spacing-xl;
}

.scout-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.2;
}

.scout-percent {
  font-size: $font-size-xl;
  font-weight: 700;
  color: $text-primary;
}

.scout-status {
  font-size: $font-size-xs;
  font-weight: 500;

  &--success { color: $color-success; }
  &--accent { color: $color-accent; }
  &--warning { color: $color-warning; }
  &--danger { color: $color-danger; }
}

.scout-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.scout-row {
  display: flex;
  justify-content: space-between;
  padding: $spacing-sm 0;
  border-bottom: 1px solid $border-dark;

  &:last-child {
    border-bottom: none;
  }

  .scout-label {
    font-size: $font-size-sm;
    color: $text-secondary;
  }

  .scout-value {
    font-size: $font-size-sm;
    font-weight: 600;
    color: $text-primary;
  }
}

.breeder-intel {
  display: flex;
  gap: $spacing-lg;
}

.intel-stat {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  flex: 1;
  padding: $spacing-md;
  background: $bg-medium;
  border-radius: $radius-md;

  .intel-icon {
    font-size: $font-size-2xl;
  }

  .intel-info {
    display: flex;
    flex-direction: column;
  }

  .intel-value {
    font-size: $font-size-xl;
    font-weight: 700;
    color: $text-highlight;
  }

  .intel-label {
    font-size: $font-size-xs;
    color: $text-muted;
  }
}

.breeder-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  max-height: 150px;
  overflow-y: auto;
}

.breeder-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  background: $bg-medium;
  border-radius: $radius-sm;

  .breeder-icon {
    font-size: $font-size-lg;
  }

  .breeder-info {
    flex: 1;
    display: flex;
    flex-direction: column;

    .breeder-name {
      font-weight: 500;
      color: $text-primary;
    }

    .breeder-race {
      font-size: $font-size-xs;
      color: $text-muted;
    }
  }

  .breeder-charm {
    font-size: $font-size-sm;
    color: $text-secondary;
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
