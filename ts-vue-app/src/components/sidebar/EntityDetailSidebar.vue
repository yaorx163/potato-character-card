<!-- components/sidebar/EntityDetailSidebar.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import ChampionDetail from './ChampionDetail.vue';
import BreederDetail from './BreederDetail.vue';
import LocationDetail from './LocationDetail.vue';

const store = useGameStore();

const 显示侧边栏 = computed(() => store.选中实体ID !== null);
</script>

<template>
  <Transition name="slide">
    <aside v-if="显示侧边栏" class="detail-sidebar">
      <div class="sidebar-header">
        <h3 class="sidebar-title">
          <template v-if="store.选中实体类型 === '冠军'">冠军详情</template>
          <template v-else-if="store.选中实体类型 === '母畜'">母畜详情</template>
          <template v-else-if="store.选中实体类型 === '地点'">地点详情</template>
        </h3>
        <button class="close-btn" @click="store.清除选择()">✕</button>
      </div>

      <div class="sidebar-content">
        <ChampionDetail
          v-if="store.选中实体类型 === '冠军' && store.选中的冠军"
          :champion="store.选中的冠军"
        />
        <BreederDetail
          v-else-if="store.选中实体类型 === '母畜' && store.选中的母畜"
          :breeder="store.选中的母畜"
        />
        <LocationDetail
          v-else-if="store.选中实体类型 === '地点' && store.选中的地点"
          :location="store.选中的地点"
        />
      </div>
    </aside>
  </Transition>
</template>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.detail-sidebar {
  position: fixed;
  right: 0;
  top: $header-height;
  bottom: 0;
  width: 400px;
  background: $bg-dark;
  border-left: 1px solid $border-dark;
  display: flex;
  flex-direction: column;
  z-index: $z-fixed;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.3);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-lg $spacing-xl;
  border-bottom: 1px solid $border-dark;
}

.sidebar-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-highlight;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid $border-medium;
  border-radius: 50%;
  color: $text-muted;
  cursor: pointer;
  font-size: $font-size-base;
  transition: all $transition-fast;

  &:hover {
    border-color: $color-danger;
    color: $color-danger;
  }
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-lg;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
