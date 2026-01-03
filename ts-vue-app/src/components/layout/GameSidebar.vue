<!-- components/layout/GameSidebar.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../stores/gameStore';

const store = useGameStore();

interface NavItem {
  id: typeof store.当前面板;
  label: string;
  icon: string;
  badge?: number;
}

const navItems = computed<NavItem[]>(() => [
  { id: 'dashboard', label: '总览', icon: '🏠' },
  { id: 'entities', label: '实体管理', icon: '👥', badge: store.所有冠军.length + store.所有母畜.length },
  { id: 'tasks', label: '任务派遣', icon: '📋', badge: store.已发布任务列表.length },
  { id: 'combat', label: '战斗袭击', icon: '⚔️' },
  { id: 'spells', label: '魔法施放', icon: '✨' },
  { id: 'market', label: '黑市交易', icon: '🏪' },
]);

function selectPanel(panel: typeof store.当前面板) {
  store.切换面板(panel);
}
</script>

<template>
  <aside class="game-sidebar">
    <nav class="sidebar-nav">
      <button
        v-for="item in navItems"
        :key="item.id"
        class="nav-item"
        :class="{ 'nav-item--active': store.当前面板 === item.id }"
        @click="selectPanel(item.id)"
      >
        <span class="nav-item__icon">{{ item.icon }}</span>
        <span class="nav-item__label">{{ item.label }}</span>
        <span v-if="item.badge" class="nav-item__badge">{{ item.badge }}</span>
      </button>
    </nav>

    <div class="sidebar-footer">
      <div class="lord-info" v-if="store.领主">
        <div class="lord-avatar">👹</div>
        <div class="lord-details">
          <div class="lord-name">{{ store.领主.获取属性('姓名') }}</div>
          <div class="lord-title">哥布林领主</div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped lang="scss">
@use '../../styles/variables' as *;

.game-sidebar {
  width: $sidebar-width;
  background: $bg-dark;
  border-right: 1px solid $border-dark;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-nav {
  flex: 1;
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md $spacing-lg;
  background: transparent;
  border: 1px solid transparent;
  border-radius: $radius-md;
  color: $text-secondary;
  cursor: pointer;
  transition: all $transition-fast;
  text-align: left;
  font-family: $font-family-ui;

  &:hover {
    background: $bg-medium;
    color: $text-primary;
  }

  &--active {
    background: rgba($color-primary, 0.15);
    border-color: $color-primary;
    color: $text-highlight;

    .nav-item__icon {
      transform: scale(1.1);
    }
  }

  &__icon {
    font-size: $font-size-xl;
    width: 32px;
    text-align: center;
    transition: transform $transition-fast;
  }

  &__label {
    flex: 1;
    font-size: $font-size-base;
    font-weight: 500;
  }

  &__badge {
    min-width: 24px;
    height: 24px;
    padding: 0 $spacing-sm;
    background: $color-accent;
    border-radius: 12px;
    font-size: $font-size-xs;
    font-weight: 600;
    color: $bg-darkest;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.sidebar-footer {
  padding: $spacing-lg;
  border-top: 1px solid $border-dark;
}

.lord-info {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $bg-medium;
  border: 1px solid $border-medium;
  border-radius: $radius-md;
}

.lord-avatar {
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

.lord-details {
  flex: 1;
  min-width: 0;
}

.lord-name {
  font-size: $font-size-base;
  font-weight: 600;
  color: $text-highlight;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lord-title {
  font-size: $font-size-xs;
  color: $text-muted;
}
</style>
