<!-- components/common/ActionButton.vue -->
<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'accent' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
}>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  block: false
});

defineEmits<{
  click: [event: MouseEvent]
}>();
</script>

<template>
  <button
    class="action-btn"
    :class="[
      `action-btn--${variant}`,
      `action-btn--${size}`,
      { 'action-btn--block': block, 'action-btn--loading': loading }
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="action-btn__spinner">⟳</span>
    <slot />
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  border: 1px solid transparent;
  border-radius: $radius-sm;
  font-family: $font-family-ui;
  font-weight: 500;
  cursor: pointer;
  transition: all $transition-fast;
  position: relative;
  overflow: hidden;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--sm {
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-xs;
  }

  &--md {
    padding: $spacing-sm $spacing-lg;
    font-size: $font-size-sm;
  }

  &--lg {
    padding: $spacing-md $spacing-xl;
    font-size: $font-size-base;
  }

  &--block {
    width: 100%;
  }

  &--primary {
    background: $color-primary;
    border-color: $color-primary-dark;
    color: $text-highlight;

    &:hover:not(:disabled) {
      background: $color-primary-light;
    }

    &:active:not(:disabled) {
      background: $color-primary-dark;
    }
  }

  &--accent {
    background: $color-accent;
    border-color: $color-accent-dark;
    color: $bg-darkest;

    &:hover:not(:disabled) {
      background: $color-accent-light;
    }
  }

  &--danger {
    background: $color-danger;
    border-color: darken($color-danger, 10%);
    color: $text-highlight;

    &:hover:not(:disabled) {
      background: lighten($color-danger, 10%);
    }
  }

  &--ghost {
    background: transparent;
    border-color: $border-medium;
    color: $text-secondary;

    &:hover:not(:disabled) {
      border-color: $color-primary;
      color: $text-primary;
    }
  }

  &--loading {
    pointer-events: none;
  }

  &__spinner {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
