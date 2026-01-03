<!-- components/entities/BreederCard.vue -->
<script setup lang="ts">
import type { 母畜实体 } from '@/core/entities';

const props = defineProps<{
  breeder: 母畜实体;
  selected?: boolean;
  busy?: boolean;
}>();

defineEmits<{
  select: [breeder: 母畜实体]
}>();

function getSubmissionLevel(value: number): { label: string; color: string } {
  if (value >= 90) return { label: '完全臣服', color: 'success' };
  if (value >= 75) return { label: '高度顺从', color: 'accent' };
  if (value >= 50) return { label: '勉强服从', color: 'warning' };
  if (value >= 25) return { label: '抵抗中', color: 'danger' };
  return { label: '反抗', color: 'danger' };
}
</script>

<template>
  <div
    class="breeder-card"
    :class="{
      'breeder-card--selected': selected,
      'breeder-card--busy': busy
    }"
    @click="$emit('select', breeder)"
  >
    <div class="breeder-card__header">
      <div class="breeder-avatar">👩</div>
      <div class="breeder-info">
        <h3 class="breeder-name">{{ breeder.获取属性('姓名') }}</h3>
        <div class="breeder-tags">
          <span class="tag tag--race">{{ breeder.获取属性('种族') }}</span>
          <span class="tag tag--identity">{{ breeder.获取属性('原身份') }}</span>
        </div>
      </div>
      <span v-if="busy" class="busy-badge">执行中</span>
    </div>

    <div class="breeder-card__stats">
      <div class="stat-bar">
        <div class="stat-bar__header">
          <span class="stat-bar__label">臣服度</span>
          <span
            class="stat-bar__status"
            :class="`stat-bar__status--${getSubmissionLevel(breeder.获取属性('臣服度')).color}`"
          >
            {{ getSubmissionLevel(breeder.获取属性('臣服度')).label }}
          </span>
        </div>
        <div class="stat-bar__track">
          <div
            class="stat-bar__fill stat-bar__fill--success"
            :style="{ width: `${breeder.获取属性('臣服度')}%` }"
          />
        </div>
      </div>

      <div class="stat-bar">
        <div class="stat-bar__header">
          <span class="stat-bar__label">淫乱度</span>
          <span class="stat-bar__value">{{ breeder.获取属性('淫乱度') }}%</span>
        </div>
        <div class="stat-bar__track">
          <div
            class="stat-bar__fill stat-bar__fill--danger"
            :style="{ width: `${breeder.获取属性('淫乱度')}%` }"
          />
        </div>
      </div>

      <div class="stat-bar">
        <div class="stat-bar__header">
          <span class="stat-bar__label">生育力</span>
          <span class="stat-bar__value">
            {{ breeder.获取属性('剩余生育力') }} / {{ breeder.获取属性('总生育力') }}
          </span>
        </div>
        <div class="stat-bar__track">
          <div
            class="stat-bar__fill stat-bar__fill--accent"
            :style="{ width: `${(breeder.获取属性('剩余生育力') / breeder.获取属性('总生育力')) * 100}%` }"
          />
        </div>
      </div>
    </div>

    <div class="breeder-card__footer">
      <div class="breeder-meta">
        <span class="meta-item">
          <span class="meta-icon">💫</span>
          魅力 {{ breeder.获取属性('魅力') }}
        </span>
        <span class="meta-item">
          <span class="meta-icon">📅</span>
          {{ breeder.获取属性('年龄') }}岁
        </span>
      </div>
      <div class="birth-count">
        <span class="birth-label">生育记录</span>
        <span class="birth-value">
          {{ breeder.冠军生育记录.length }}冠军 / {{ breeder.喽啰生育记录 }}喽啰
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.breeder-card {
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
    align-items: flex-start;
    gap: $spacing-md;
    margin-bottom: $spacing-lg;
  }

  &__stats {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    padding: $spacing-md 0;
    border-top: 1px solid $border-dark;
    border-bottom: 1px solid $border-dark;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: $spacing-md;
  }
}

.breeder-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #ffd1dc 0%, #ffb6c1 100%);
  border: 2px solid $border-light;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-2xl;
}

.breeder-info {
  flex: 1;
  min-width: 0;
}

.breeder-name {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-highlight;
  margin: 0 0 $spacing-xs;
}

.breeder-tags {
  display: flex;
  gap: $spacing-xs;
  flex-wrap: wrap;
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

.busy-badge {
  padding: $spacing-xs $spacing-sm;
  background: $color-warning;
  border-radius: $radius-sm;
  font-size: $font-size-xs;
  font-weight: 600;
  color: $bg-darkest;
}

.stat-bar {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-xs;
  }

  &__label {
    font-size: $font-size-xs;
    color: $text-muted;
  }

  &__value {
    font-size: $font-size-xs;
    color: $text-secondary;
  }

  &__status {
    font-size: $font-size-xs;
    font-weight: 500;

    &--success { color: $color-success; }
    &--accent { color: $color-accent; }
    &--warning { color: $color-warning; }
    &--danger { color: $color-danger; }
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

    &--success { background: $color-success; }
    &--accent { background: $color-accent; }
    &--warning { background: $color-warning; }
    &--danger { background: $color-danger; }
  }
}

.breeder-meta {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: $font-size-xs;
  color: $text-secondary;

  .meta-icon {
    font-size: $font-size-sm;
  }
}

.birth-count {
  text-align: right;

  .birth-label {
    display: block;
    font-size: $font-size-xs;
    color: $text-muted;
    margin-bottom: 2px;
  }

  .birth-value {
    font-size: $font-size-sm;
    font-weight: 600;
    color: $color-accent;
  }
}
</style>
