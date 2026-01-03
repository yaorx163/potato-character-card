<!-- components/layout/TabNav.vue -->
<!-- 介绍：顶部导航栏组件 -->
<script setup lang="ts">
interface Tab {
  id: string
  label: string
  icon: string
}

const props = defineProps<{
  tabs: readonly Tab[]
  active: string
}>()

const emit = defineEmits<{
  'update:active': [value: string]
}>()
</script>

<template>
  <nav class="tab-nav">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="tab-nav__item"
      :class="{ 'tab-nav__item--active': active === tab.id }"
      @click="emit('update:active', tab.id)"
    >
      <span class="tab-icon">{{ tab.icon }}</span>
      <span class="tab-label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style lang="scss" scoped>
.tab-nav {
  display: flex;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-dark);

  &__item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 0px 0px;
    border: none;
    background: transparent;
    color: var(--text-dim);
    cursor: pointer;
    transition: all 0.15s;
    border-bottom: 2px solid transparent;

    &:hover {
      color: var(--text-secondary);
      background: var(--bg-hover);
    }

    &--active {
      color: var(--text-primary);
      background: var(--bg-secondary);
      border-bottom-color: var(--accent-blood);

      .tab-icon {
        color: var(--accent-blood-light);
      }
    }
  }
}

.tab-icon {
  font-size: 20px;;
}

.tab-label {
  font-size: 16px;
}

@media (max-width: 360px) {
  .tab-label {
    display: none;
  }
}
</style>
