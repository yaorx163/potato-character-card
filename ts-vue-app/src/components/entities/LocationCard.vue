<!-- components/entities/LocationCard.vue -->
<script setup lang="ts">
import type { 可袭击地点实体 } from '@/core/entities';
import ProgressRing from '@/components/common/ProgressRing.vue';

const props = defineProps<{
  location: 可袭击地点实体;
  selected?: boolean;
}>();

defineEmits<{
  select: [location: 可袭击地点实体]
}>();

function getScoutStatus(progress: number, max: number):{ label: string; color: 'primary' | 'accent' | 'success' | 'warning' | 'danger' } {
  const ratio = progress / max;
  if (ratio >= 1) return { label: '完成', color: 'success' };
  if (ratio >= 0.6) return { label: '情报充分', color: 'accent' };
  if (ratio >= 0.3) return { label: '初步了解', color: 'warning' };
  return { label: '未知', color: 'danger' };
}
</script>

<template>
  <div
    class="location-card"
    :class="{ 'location-card--selected': selected }"
    @click="$emit('select', location)"
  >
    <div class="location-card__header">
      <div class="location-icon">🏘️</div>
      <div class="location-info">
        <h3 class="location-name">{{ location.地点名称 }}</h3>
        <span class="location-type">{{ location.地点类型 }}</span>
      </div>
      <ProgressRing
        :value="location.获取侦察进度()"
        :max="location.获取侦查最大值()"
        :size="48"
        :stroke-width="4"
        :color="getScoutStatus(location.获取侦察进度(), location.获取侦查最大值()).color"
      >
        <span class="scout-icon">🔍</span>
      </ProgressRing>
    </div>

    <p class="location-card__desc">{{ location.描述 }}</p>

    <div class="location-card__stats">
      <div class="stat-item">
        <span class="stat-icon">⚔️</span>
        <span class="stat-label">战斗力</span>
        <span class="stat-value">
          <template v-if="location.获取战斗力估值()">
            ≈{{ Math.round(location.获取战斗力估值()!) }}
          </template>
          <template v-else>???</template>
        </span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">👩</span>
        <span class="stat-label">已侦察</span>
        <span class="stat-value">{{ location.获取已侦察母畜数量() }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">❓</span>
        <span class="stat-label">未侦察</span>
        <span class="stat-value">{{ location.获取潜在母畜数量() }}</span>
      </div>
    </div>

    <div class="location-card__footer">
      <span
        class="scout-status"
        :class="`scout-status--${getScoutStatus(location.获取侦察进度(), location.获取侦查最大值()).color}`"
      >
        {{ getScoutStatus(location.获取侦察进度(), location.获取侦查最大值()).label }}
      </span>
      <span class="scout-progress">
        {{ location.获取侦察进度() }} / {{ location.获取侦查最大值() }}
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.location-card {
  background: $bg-medium;
  border: 1px solid $border-medium;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  cursor: pointer;
  transition: all $transition-base;

  &:hover {
    border-color: $color-primary;
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }

  &--selected {
    border-color: $color-accent;
    background: rgba($color-accent, 0.08);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    margin-bottom: $spacing-md;
  }

  &__desc {
    font-size: $font-size-sm;
    color: $text-secondary;
    line-height: $line-height-loose;
    margin-bottom: $spacing-lg;
  }

  &__stats {
    display: flex;
    justify-content: space-between;
    padding: $spacing-md 0;
    border-top: 1px solid $border-dark;
    border-bottom: 1px solid $border-dark;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: $spacing-md;
  }
}

.location-icon {
  width: 48px;
  height: 48px;
  background: $bg-light;
  border: 2px solid $border-light;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-2xl;
}

.location-info {
  flex: 1;
  min-width: 0;
}

.location-name {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-highlight;
  margin: 0 0 $spacing-xs;
}

.location-type {
  font-size: $font-size-xs;
  color: $text-muted;
  background: $bg-light;
  padding: 2px $spacing-sm;
  border-radius: $radius-sm;
}

.scout-icon {
  font-size: $font-size-base;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;

  .stat-icon {
    font-size: $font-size-lg;
  }

  .stat-label {
    font-size: $font-size-xs;
    color: $text-muted;
  }

  .stat-value {
    font-size: $font-size-base;
    font-weight: 600;
    color: $text-primary;
  }
}

.scout-status {
  font-size: $font-size-sm;
  font-weight: 500;

  &--success { color: $color-success; }
  &--accent { color: $color-accent; }
  &--warning { color: $color-warning; }
  &--danger { color: $color-danger; }
}

.scout-progress {
  font-size: $font-size-xs;
  color: $text-muted;
}
</style>
