<!-- components/common/ProgressRing.vue -->
<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'danger';
}>(), {
  size: 60,
  strokeWidth: 6,
  color: 'primary'
});

const radius = computed(() => (props.size - props.strokeWidth) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const percentage = computed(() => props.max > 0 ? props.value / props.max : 0);
const offset = computed(() => circumference.value * (1 - percentage.value));
</script>

<template>
  <div class="progress-ring" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size">
      <circle
        class="progress-ring__bg"
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        :stroke-width="strokeWidth"
      />
      <circle
        class="progress-ring__fill"
        :class="`progress-ring__fill--${color}`"
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        :stroke-width="strokeWidth"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
      />
    </svg>
    <div class="progress-ring__content">
      <slot>
        <span class="progress-ring__value">{{ Math.round(percentage * 100) }}%</span>
      </slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.progress-ring {
  position: relative;

  svg {
    transform: rotate(-90deg);
  }

  &__bg {
    fill: none;
    stroke: $bg-light;
  }

  &__fill {
    fill: none;
    transition: stroke-dashoffset $transition-base;

    &--primary { stroke: $color-primary; }
    &--accent { stroke: $color-accent; }
    &--success { stroke: $color-success; }
    &--warning { stroke: $color-warning; }
    &--danger { stroke: $color-danger; }
  }

  &__content {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__value {
    font-size: $font-size-sm;
    font-weight: 600;
    color: $text-primary;
  }
}
</style>
