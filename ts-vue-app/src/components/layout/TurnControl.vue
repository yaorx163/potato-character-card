<!-- components/layout/TurnControl.vue -->
<!-- 介绍：回合控制 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()

const pendingTasks = computed(() =>{
  store.检查状态更新()
  return store.已发布任务列表.length
})
const hasCombat = computed(() =>{
  store.检查状态更新()
  return store.游戏实例?.战斗管理.是否战斗() ?? false
})

function endTurn() {
  store.结束回合()
  console.log(store.游戏实例)
}
</script>

<template>
  <div class="turn-control">
    <div class="turn-control__info">
      <span v-if="pendingTasks > 0" class="pending-badge">
        {{ pendingTasks }} 个待执行任务
      </span>
      <span v-if="hasCombat" class="combat-badge">
        ⚔ 战斗已确认
      </span>
    </div>

    <button
      class="btn btn--primary turn-btn"
      @click="endTurn"
    >
      结束回合 →
    </button>
  </div>
</template>

<style lang="scss" scoped>
.turn-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-dark);

  &__info {
    display: flex;
    gap: 8px;
    font-size: 15px;
  }
}

.pending-badge {
  color: var(--accent-gold);
}

.combat-badge {
  color: var(--accent-blood-light);
}

.turn-btn {
  padding: 6px 16px;
  font-size: 18px;
  font-weight: 500;
}
</style>
