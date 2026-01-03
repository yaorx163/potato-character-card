<!-- components/common/ResourceBar.vue -->
<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  label: string;
  current: number;
  max: number;
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'danger';
  icon?: string;
  showMax?: boolean;
}>(), {
  color: 'primary',
  showMax: true
});

const percentage = computed(() => {
  if (props.max <= 0) return 0;
  return Math.min(100, (props.current / props.max) * 100);
});
</script>

<template>
  <div class="resource-bar">
    <div class="resource-bar__header">
      <span v-if="icon" class="resource-bar__icon">{{ icon }}</span>
      <span class="resource-bar__label">{{ label }}</span>
      <span class="resource-bar__value">
        {{ current }}<template v-if="showMax">/{{ max }}</template>
      </span>
    </div>
    <div class="resource-bar__track">
      <div
        class="resource-bar__fill"
        :class="`resource-bar__fill--${color}`"
        :style="{ width: `${percentage}%` }"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '../../styles/variables' as *;

.resource-bar {
  min-width: 120px;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    margin-bottom: $spacing-xs;
  }

  &__icon {
    font-size: $font-size-sm;
  }

  &__label {
    font-size: $font-size-xs;
    color: $text-muted;
    flex: 1;
  }

  &__value {
    font-size: $font-size-sm;
    font-weight: 600;
    color: $text-primary;
  }

  &__track {
    height: 6px;
    background: $bg-light;
    border-radius: 3px;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    border-radius: 3px;
    transition: width $transition-base;

    &--primary { background: linear-gradient(90deg, $color-primary-dark, $color-primary); }
    &--accent { background: linear-gradient(90deg, $color-accent-dark, $color-accent); }
    &--success { background: linear-gradient(90deg, darken($color-success, 10%), $color-success); }
    &--warning { background: linear-gradient(90deg, darken($color-warning, 10%), $color-warning); }
    &--danger { background: linear-gradient(90deg, darken($color-danger, 10%), $color-danger); }
  }
}
</style>
