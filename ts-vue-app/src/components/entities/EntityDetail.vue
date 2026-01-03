<!-- components/entities/EntityDetail.vue -->
<!-- 介绍：实体详情 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import ChampionDetail from './ChampionDetail.vue'
import BroodmotherDetail from './BroodmotherDetail.vue'
import LocationDetail from './LocationDetail.vue'

const store = useGameStore()

const detailComponent = computed(() => {
  switch (store.选中实体类型) {
    case '冠军': return ChampionDetail
    case '母畜': return BroodmotherDetail
    case '地点': return LocationDetail
    default: return null
  }
})
</script>

<template>
  <div class="entity-detail">
    <button
      class="close-btn"
      @click="store.清除选择()"
    >×</button>

    <component
      v-if="detailComponent"
      :is="detailComponent"
    />
  </div>
</template>

<style lang="scss" scoped>
.entity-detail {
  position: relative;
}

.close-btn {
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--text-dim);
  font-size: 16px;
  cursor: pointer;

  &:hover {
    color: var(--text-primary);
  }
}
</style>
