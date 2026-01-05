<!-- components/panels/CombatPanel.vue -->
<!-- 介绍：战斗面板 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()

const combatManager = computed(() => {
  store.检查状态更新()
  return store.游戏实例?.系统管理.获取战斗管理器()
})
const selectedTarget = computed(() =>  {
  store.检查状态更新()
  return combatManager.value?.获取选定目标()
})
const deployedChampions = computed(() =>  {
  store.检查状态更新()
  return combatManager.value?.获取当前部署列表() ?? []
})
const preview = computed(() =>  {
  store.检查状态更新()
  return store.获取战斗预览()
})

const availableChampions = computed(() => {
  if (!combatManager.value) return []
  return combatManager.value.获取可出战将领(store.所有冠军)
})

// 计算可用将领的战斗力预估
function getChampionCombatPower(championId: string): number {
  const champion = store.所有冠军.find(c => c.实体ID === championId)
  if (!champion) return 0
  // 假设冠军有获取战斗力的方法，或者从战斗管理器获取
  return champion.管理喽啰池!.获取战斗力()
}

// 是否可以确认战斗（有目标且有部署将领即可）
const canConfirmBattle = computed(() => {
  return selectedTarget.value && deployedChampions.value.length > 0
})

// 我方总战斗力
const totalAllyPower = computed(() => {
  return deployedChampions.value.reduce((sum, d) => sum + d.战斗力, 0)
})

function selectTarget(locationId: string) {
  store.更新冠军列表()
  store.选择战斗目标(locationId)
}

function deployChampion(championId: string) {
  store.添加出战将领(championId)
}

function removeChampion(championId: string) {
  store.移除出战将领(championId)
}

function confirmBattle() {
  store.更新通用状态()
  store.确认战斗()
}
</script>

<template>
  <div class="combat-panel">
    <!-- 目标选择 -->
    <section class="panel-section">
      <h3 class="section-title">选择目标</h3>

      <div class="location-list">
        <div
          v-for="location in store.所有地点"
          :key="location.实体ID"
          class="location-item"
          :class="{ 'location-item--selected': selectedTarget?.实体ID === location.实体ID }"
          @click="selectTarget(location.实体ID)"
        >
          <div class="location-item__info">
            <span class="location-name">{{ location.地点名称 }}</span>
            <span class="location-type">{{ location.地点类型 }}</span>
          </div>
          <div class="location-item__stats">
            <span v-if="location.获取战斗力估值()" class="stat-badge">
              ⚔ {{ Math.round(location.获取战斗力估值()!) }}
            </span>
            <span v-else class="stat-badge stat-badge--unknown">
              ⚔ ???
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- 将领部署 -->
    <section v-if="selectedTarget" class="panel-section">
      <h3 class="section-title">部署将领</h3>

      <!-- 可用将领 -->
      <div class="champion-section">
        <span class="subsection-label">可用将领</span>
        <div class="champion-chips">
          <button
            v-for="champion in availableChampions"
            :key="champion.实体ID"
            class="champion-chip"
            @click="deployChampion(champion.实体ID)"
          >
            {{ champion.获取属性('姓名') }}
            <span class="chip-power chip-power--preview">⚔{{ Math.round(getChampionCombatPower(champion.实体ID)) }}</span>
            <span class="chip-add">+</span>
          </button>
          <span v-if="availableChampions.length === 0" class="no-data">
            无可用将领
          </span>
        </div>
      </div>

      <!-- 已部署 -->
      <div class="champion-section">
        <span class="subsection-label">已部署 ({{ deployedChampions.length }})</span>
        <div class="champion-chips">
          <button
            v-for="deploy in deployedChampions"
            :key="deploy.将领ID"
            class="champion-chip champion-chip--deployed"
            @click="removeChampion(deploy.将领ID)"
          >
            {{ deploy.将领.获取属性('姓名') }}
            <span class="chip-power">⚔{{ Math.round(deploy.战斗力) }}</span>
            <span class="chip-remove">×</span>
          </button>
        </div>
      </div>
    </section>

    <!-- 战斗预览 - 即使未侦察也显示 -->
    <section v-if="canConfirmBattle" class="panel-section preview-section">
      <h3 class="section-title">战斗预览</h3>

      <div class="preview-stats">
        <div class="preview-row">
          <span>我方战斗力</span>
          <span class="text-accent">{{ Math.round(totalAllyPower) }}</span>
        </div>
        <div class="preview-row">
          <span>敌方战斗力</span>
          <template v-if="selectedTarget?.获取战斗力估值()">
            <span>{{ Math.round(selectedTarget.获取战斗力估值()!) }}</span>
          </template>
          <template v-else>
            <span class="text-dim">未侦察</span>
          </template>
        </div>
        <div class="preview-row">
          <span>预估胜率</span>
          <template v-if="preview?.胜率预估 !== undefined">
            <span :class="preview.胜率预估 >= 0.5 ? 'text-success' : 'text-danger'">
              {{ Math.round(preview.胜率预估 * 100) }}%
            </span>
          </template>
          <template v-else>
            <span class="text-dim">未知</span>
          </template>
        </div>
      </div>

      <button
        class="btn btn--primary confirm-btn"
        @click="confirmBattle"
      >
        确认出战
      </button>

      <p v-if="!selectedTarget?.获取战斗力估值()" class="warning-text">
        ⚠ 未侦察敌情，战斗风险未知
      </p>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.combat-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-dark);
}

.location-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 120px;
  overflow-y: auto;
}

.location-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: var(--bg-secondary);
  border-radius: 2px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.1s;

  &:hover {
    background: var(--bg-hover);
  }

  &--selected {
    border-color: var(--accent-blood);
    background: var(--bg-hover);
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
}

.location-name {
  font-size: 16px;
  color: var(--text-primary);
}

.location-type {
  font-size: 18px;
  color: var(--text-dim);
}

.stat-badge {
  font-size: 15px;
  padding: 2px 5px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  color: var(--accent-blood-light);

  &--unknown {
    color: var(--text-dim);
  }
}

.champion-section {
  margin-bottom: 10px;

  &:last-child {
    margin-bottom: 0;
  }
}

.subsection-label {
  display: block;
  font-size: 15px;
  color: var(--text-dim);
  margin-bottom: 6px;
}

.champion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.champion-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 15px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-dark);
  border-radius: 2px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.1s;

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  &--deployed {
    background: rgba(139,38,53,0.2);
    border-color: var(--accent-blood);
    color: var(--text-primary);
  }
}

.chip-add {
  color: var(--accent-poison);
}

.chip-remove {
  color: var(--accent-blood-light);
}

.chip-power {
  font-size: 18px;
  color: var(--accent-gold);

  &--preview {
    color: var(--text-dim);
  }
}

.no-data {
  font-size: 15px;
  color: var(--text-dim);
}

.preview-section {
  background: rgba(139,38,53,0.1);
  border: 1px solid var(--accent-blood);
}

.preview-stats {
  margin-bottom: 10px;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  font-size: 16px;
  color: var(--text-secondary);
  padding: 3px 0;
}

.text-accent { color: var(--accent-gold); }
.text-success { color: var(--success); }
.text-danger { color: var(--danger); }
.text-dim { color: var(--text-dim); font-style: italic; }

.confirm-btn {
  width: 100%;
}

.warning-text {
  margin-top: 8px;
  font-size: 12px;
  color: var(--warning, #f0ad4e);
  text-align: center;
}
</style>
