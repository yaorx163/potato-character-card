<!-- components/panels/MinionPanel.vue -->
<!-- 介绍：喽啰管理面板，用于分配各将领的喽啰数量 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()

// 获取所有冠军及其喽啰池信息
const championMinionData = computed(() => {
  store.检查状态更新()
  return store.所有冠军.map(champion => {
    const pool = champion.获取喽啰池()
    return {
      id: champion.实体ID,
      name: champion.获取属性('姓名'),
      current: pool?.获取总数量() ?? 0,
      max: pool?.获取最大数量() ?? 0,
      power: pool?.获取战斗力() ?? 0
    }
  })
})

// 总喽啰信息
const totalMinionInfo = computed(() => {
  store.检查状态更新()
  const total = store.喽啰总数
  const allocated = championMinionData.value.reduce((sum, c) => sum + c.current, 0)
  const unallocated = total - allocated
  return { total, allocated, unallocated }
})

// 自动分配喽啰 - 按各将领最大容量比例分配
function autoDistribute() {
  // gameStore方法：将未分配喽啰按比例分配给所有将领
  store.自动分配喽啰()
}

// 清空某将领喽啰
function clearMinions(championId: string) {
  // gameStore方法：将指定将领的喽啰全部移除（返回未分配池）
  store.清空将领喽啰(championId)
}

// 填满某将领喽啰
function fillMinions(championId: string) {
  // gameStore方法：用未分配喽啰填满指定将领的喽啰池
  store.填满将领喽啰(championId)
}

// 清空所有将领喽啰
function clearAll() {
  // gameStore方法：清空所有将领的喽啰
  store.清空所有喽啰()
}
</script>

<template>
  <div class="minion-panel">
    <!-- 总览信息 -->
    <section class="panel-section overview-section">
      <h3 class="section-title">喽啰总览</h3>
      <div class="overview-stats">
        <div class="overview-stat">
          <span class="stat-icon">☠</span>
          <div class="stat-info">
            <span class="stat-value">{{ totalMinionInfo.total }}</span>
            <span class="stat-label">总数</span>
          </div>
        </div>
        <div class="overview-stat">
          <span class="stat-icon">⚔</span>
          <div class="stat-info">
            <span class="stat-value">{{ totalMinionInfo.allocated }}</span>
            <span class="stat-label">已分配</span>
          </div>
        </div>
        <div class="overview-stat">
          <span class="stat-icon">◇</span>
          <div class="stat-info">
            <span class="stat-value highlight">{{ totalMinionInfo.unallocated }}</span>
            <span class="stat-label">待分配</span>
          </div>
        </div>
      </div>

      <div class="global-actions">
        <button
          class="btn btn--primary"
          @click="autoDistribute"
          :disabled="totalMinionInfo.unallocated <= 0"
        >
          <span class="btn-icon">⚡</span> 自动分配
        </button>
        <button
          class="btn"
          @click="clearAll"
          :disabled="totalMinionInfo.allocated <= 0"
        >
          <span class="btn-icon">↺</span> 全部清空
        </button>
      </div>
    </section>

    <!-- 将领喽啰列表 -->
    <section class="panel-section">
      <h3 class="section-title">将领分配</h3>

      <div v-if="championMinionData.length === 0" class="empty-hint">
        暂无将领
      </div>

      <div v-else class="champion-list">
        <div
          v-for="champion in championMinionData"
          :key="champion.id"
          class="champion-minion-card"
        >
          <div class="card-header">
            <span class="champion-name">{{ champion.name }}</span>
            <span class="champion-power">
              <span class="power-icon">⚔</span>
              {{ Math.round(champion.power) }}
            </span>
          </div>

          <div class="minion-bar-wrapper">
            <div class="minion-bar">
              <div
                class="minion-bar__fill"
                :style="{ width: (champion.current / champion.max * 100) + '%' }"
              />
            </div>
            <span class="minion-count">{{ champion.current }} / {{ champion.max }}</span>
          </div>

          <div class="card-controls">
            <div class="adjust-controls">

            </div>

            <div class="quick-controls">
              <button
                class="btn btn--small"
                @click="clearMinions(champion.id)"
                :disabled="champion.current <= 0"
              >清空</button>
              <button
                class="btn btn--small btn--accent"
                @click="fillMinions(champion.id)"
                :disabled="champion.current >= champion.max || totalMinionInfo.unallocated <= 0"
              >填满</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 喽啰来源提示 -->
    <section class="panel-section hint-section">
      <div class="hint-row">
        <span class="hint-icon">💡</span>
        <span class="hint-text">喽啰可通过母畜繁殖获取</span>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.minion-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-section {
  background: var(--bg-tertiary);
  border-radius: 3px;
  padding: 10px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-dark);
}

.overview-section {
  background: linear-gradient(135deg, var(--bg-tertiary) 0%, rgba(139,38,53,0.1) 100%);
}

.overview-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 12px;
}

.overview-stat {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  font-size: 24px;
  opacity: 0.8;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);

  &.highlight {
    color: var(--accent-gold);
  }
}

.stat-label {
  font-size: 12px;
  color: var(--text-dim);
}

.global-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-icon {
  margin-right: 4px;
}

.champion-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.champion-minion-card {
  background: var(--bg-secondary);
  border-radius: 3px;
  padding: 10px;
  border: 1px solid var(--border-dark);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.champion-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.champion-power {
  font-size: 13px;
  color: var(--accent-blood-light);
  display: flex;
  align-items: center;
  gap: 3px;
}

.power-icon {
  font-size: 12px;
}

.minion-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.minion-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-primary);
  border-radius: 4px;
  overflow: hidden;

  &__fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-poison) 0%, var(--accent-corrupt) 100%);
    transition: width 0.3s ease;
    border-radius: 4px;
  }
}

.minion-count {
  font-size: 13px;
  color: var(--text-secondary);
  min-width: 60px;
  text-align: right;
}

.card-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.adjust-controls {
  display: flex;
  gap: 4px;
}

.adjust-btn {
  padding: 4px 8px;
  font-size: 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-dark);
  border-radius: 2px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.quick-controls {
  display: flex;
  gap: 4px;
}

.btn--accent {
  background: rgba(107, 74, 124, 0.3);
  border-color: var(--accent-corrupt);

  &:hover:not(:disabled) {
    background: rgba(107, 74, 124, 0.5);
  }
}

.hint-section {
  background: rgba(74, 92, 138, 0.1);
  border: 1px dashed var(--accent-mana);
}

.hint-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hint-icon {
  font-size: 16px;
}

.hint-text {
  font-size: 13px;
  color: var(--text-dim);
}

.empty-hint {
  font-size: 14px;
  color: var(--text-dim);
  text-align: center;
  padding: 20px;
}
</style>
