<!-- components/entities/EntityList.vue -->
<!-- 介绍：实体列表组件 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import type { 冠军实体, 母畜实体, 可袭击地点实体 } from '@/core/entities'

const props = defineProps<{
  type: 'champions' | 'broodmothers' | 'locations'
}>()

const store = useGameStore()

const entities = computed(() => {
  switch (props.type) {
    case 'champions': return store.所有冠军
    case 'broodmothers': return store.所有母畜
    case 'locations': return store.所有地点
  }
})

const entityTypeMap = {
  champions: '冠军',
  broodmothers: '母畜',
  locations: '地点'
} as const

function selectEntity(entity: 冠军实体 | 母畜实体 | 可袭击地点实体) {
  store.选择实体(entity.实体ID, entityTypeMap[props.type])
}

function getEntityName(entity: any): string {
  if (props.type === 'locations') {
    return entity.地点名称
  }
  return entity.获取属性('姓名')
}

function getEntitySubtext(entity: any): string {
  if (props.type === 'champions') {
    const str = entity.获取属性('力量')
    const agi = entity.获取属性('敏捷')
    const int = entity.获取属性('智力')
    return `力${str} 敏${agi} 智${int}`
  }
  if (props.type === 'broodmothers') {
    const fert = entity.获取属性('剩余生育力')
    const sub = entity.获取属性('臣服度')
    return `育${fert} 服${sub}`
  }
  if (props.type === 'locations') {
    return entity.地点类型
  }
  return ''
}
</script>

<template>
  <div class="entity-list">
    <div
      v-for="entity in entities"
      :key="entity.实体ID"
      class="entity-item"
      :class="{ 'entity-item--selected': store.选中实体ID === entity.实体ID }"
      @click="selectEntity(entity)"
    >
      <div class="entity-item__main">
        <span class="entity-item__name">{{ getEntityName(entity) }}</span>
        <span class="entity-item__sub">{{ getEntitySubtext(entity) }}</span>
      </div>
      <span class="entity-item__arrow">›</span>
    </div>

    <div v-if="entities.length === 0" class="empty-list">
      暂无{{ entityTypeMap[type] }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.entity-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.entity-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.1s;

  &:hover {
    background: var(--bg-hover);
  }

  &--selected {
    background: var(--bg-hover);
    border-left: 2px solid var(--accent-blood);
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  &__name {
    font-size: 16px;
    color: var(--text-primary);
  }

  &__sub {
    font-size: 18px;
    color: var(--text-dim);
  }

  &__arrow {
    color: var(--text-dim);
    font-size: 20px;
  }
}

.empty-list {
  font-size: 16px;
  color: var(--text-dim);
  text-align: center;
  padding: 20px;
}
</style>
