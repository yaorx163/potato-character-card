<!-- components/entities/ChampionCard.vue -->
<script setup lang="ts">
import type { 冠军实体 } from '@/core/entities';
import ProgressRing from '@/components/common/ProgressRing.vue';

const props = defineProps<{
  champion: 冠军实体;
  selected?: boolean;
  busy?: boolean;
}>();

defineEmits<{
  select: [champion: 冠军实体]
}>();

function getAttributeColor(value: number): 'primary' | 'accent' | 'success' | 'warning' | 'danger' {
  if (value >= 80) return 'accent';
  if (value >= 50) return 'success';
  if (value >= 30) return 'warning';
  return 'danger';
}
</script>

<template>
  <div
    class="champion-card"
    :class="{
      'champion-card--selected': selected,
      'champion-card--busy': busy
    }"
    @click="$emit('select', champion)"
  >
    <div class="champion-card__header">
      <div class="champion-avatar">👺</div>
      <div class="champion-info">
        <h3 class="champion-name">{{ champion.获取属性('姓名') }}</h3>
        <span class="champion-origin">{{ champion.获取属性('来源') || '未知' }}</span>
      </div>
      <span v-if="busy" class="busy-badge">执行中</span>
    </div>

    <div class="champion-card__stats">
      <div class="stat-ring">
        <ProgressRing
          :value="champion.获取属性('力量')"
          :max="100"
          :size="48"
          :stroke-width="4"
          :color="getAttributeColor(champion.获取属性('力量'))"
        >
          <span class="stat-value">{{ champion.获取属性('力量') }}</span>
        </ProgressRing>
        <span class="stat-label">力量</span>
      </div>
      <div class="stat-ring">
        <ProgressRing
          :value="champion.获取属性('敏捷')"
          :max="100"
          :size="48"
          :stroke-width="4"
          :color="getAttributeColor(champion.获取属性('敏捷'))"
        >
          <span class="stat-value">{{ champion.获取属性('敏捷') }}</span>
        </ProgressRing>
        <span class="stat-label">敏捷</span>
      </div>
      <div class="stat-ring">
        <ProgressRing
          :value="champion.获取属性('智力')"
          :max="100"
          :size="48"
          :stroke-width="4"
          :color="getAttributeColor(champion.获取属性('智力'))"
        >
          <span class="stat-value">{{ champion.获取属性('智力') }}</span>
        </ProgressRing>
        <span class="stat-label">智力</span>
      </div>
    </div>

    <div class="champion-card__footer">
      <div class="minion-info">
        <span class="minion-icon">👥</span>
        <span class="minion-count">
          {{ champion.获取喽啰池()?.获取总数量() ?? 0 }} /
          {{ champion.计算可统帅喽啰数() }}
        </span>
      </div>
      <div class="combat-power">
        <span class="power-label">战力</span>
        <span class="power-value">{{ Math.round(champion.获取喽啰池()?.获取战斗力() ?? 0) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.champion-card {
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

  &--busy {
    opacity: 0.7;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    margin-bottom: $spacing-lg;
  }

  &__stats {
    display: flex;
    justify-content: space-around;
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

.champion-avatar {
  width: 48px;
  height: 48px;
  background: $bg-light;
  border: 2px solid $color-primary;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-2xl;
}

.champion-info {
  flex: 1;
  min-width: 0;
}

.champion-name {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-highlight;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.champion-origin {
  font-size: $font-size-xs;
  color: $text-muted;
}

.busy-badge {
  padding: $spacing-xs $spacing-sm;
  background: $color-warning;
  border-radius: $radius-sm;
  font-size: $font-size-xs;
  font-weight: 600;
  color: $bg-darkest;
}

.stat-ring {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
}

.stat-value {
  font-size: $font-size-sm;
  font-weight: 700;
  color: $text-primary;
}

.stat-label {
  font-size: $font-size-xs;
  color: $text-muted;
}

.minion-info {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: $font-size-sm;
  color: $text-secondary;

  .minion-icon {
    font-size: $font-size-base;
  }
}

.combat-power {
  display: flex;
  align-items: baseline;
  gap: $spacing-xs;

  .power-label {
    font-size: $font-size-xs;
    color: $text-muted;
  }

  .power-value {
    font-size: $font-size-lg;
    font-weight: 700;
    color: $color-accent;
  }
}
</style>
