<!-- components/panels/EntitiesPanel.vue -->
<!-- 介绍：实体面板 -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import EntityList from '../entities/EntityList.vue'
import EntityDetail from '../entities/EntityDetail.vue'

const store = useGameStore()

type EntityTab = 'champions' | 'broodmothers' | 'locations'

const props = defineProps<{
  activeEntities: EntityTab
}>()

const emit = defineEmits<{
  'update:active': [value: string]
}>()

const activeEntityTab = ref<EntityTab>(props.activeEntities)

const tabs = computed(() => [
  { id: 'champions' as const, label: '冠军', count: store.所有冠军.length },
  { id: 'broodmothers' as const, label: '母畜', count: store.所有母畜.length },
  { id: 'locations' as const, label: '地点', count: store.所有地点.length },
])

const showDetail = computed(() => store.选中实体ID !== null)

watch(
  () => props.activeEntities,
  (newVal) => {
    activeEntityTab.value = newVal
  }
)
// 强制组件在冠军列表变化时更新
const championsCount = computed(() => store.所有冠军.length)
const broodmothersCount = computed(() => store.所有母畜.length)
const locationsCount = computed(() => store.所有地点.length)

</script>

<template>
  <div class="entities-panel">
    <!-- 子标签 -->
    <div class="entity-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="entity-tab"
        :class="{ 'entity-tab--active': activeEntityTab === tab.id }"
        @click="activeEntityTab = tab.id; store.清除选择()"
      >
        {{ tab.label }}
        <span class="entity-tab__count">{{ tab.count }}</span>
      </button>
    </div>

    <div class="entities-panel__body">
      <!-- 列表 -->
      <div class="entity-list-wrapper" :class="{ 'entity-list-wrapper--narrow': showDetail } " :key="championsCount" >
        <EntityList
          :type="activeEntityTab"
        />
      </div>

      <!-- 详情 -->
      <Transition name="slide">
        <div v-if="showDetail" class="entity-detail-wrapper">
          <EntityDetail />
        </div>
      </Transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.entities-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.entity-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.entity-tab {
  padding: 4px 10px;
  border: 1px solid var(--border-dark);
  border-radius: 2px;
  background: var(--bg-tertiary);
  color: var(--text-dim);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    color: var(--text-secondary);
  }

  &--active {
    background: var(--bg-hover);
    color: var(--text-primary);
    border-color: var(--border-light);
  }

  &__count {
    margin-left: 4px;
    font-size: 15px;
    color: var(--text-dim);
  }
}

.entities-panel__body {
  display: flex;
  gap: 8px;
  flex: 1;
  min-height: 0;
}

.entity-list-wrapper {
  flex: 1;
  overflow-y: auto;
  transition: flex 0.2s;

  &--narrow {
    flex: 0.4;
    min-width: 100px;
  }
}

.entity-detail-wrapper {
  flex: 0.6;
  overflow-y: auto;
  background: var(--bg-tertiary);
  border-radius: 3px;
  padding: 8px;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>
