<!-- components/entities/LocationDetail.vue -->
<!-- 介绍：地点详情 - 改进版，增加侦查信息显示 -->
<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore';
import { computed } from 'vue';

const store = useGameStore();
const location = computed(() => store.选中的地点);

// 地点类型图标映射
const typeIconMap: Record<string, string> = {
  村庄: '🏘',
  城镇: '🏰',
  要塞: '⚔',
  矿洞: '⛏',
  森林: '🌲',
  洞穴: '🕳',
  神殿: '⛩',
  商队: '🐎',
  默认: '⚑',
};

// 威胁等级
const threatLevel = computed(() => {
  if (!location.value) return null;
  const power = location.value.获取战斗力估值?.();
  if (power === null || power === undefined) {
    return { label: '未知', color: 'var(--text-dim)', icon: '?' };
  }
  if (power >= 500) {
    return { label: '极高', color: 'var(--danger)', icon: '☠☠☠' };
  }
  if (power >= 300) {
    return { label: '高', color: 'var(--accent-blood)', icon: '☠☠' };
  }
  if (power >= 150) {
    return { label: '中等', color: 'var(--warning)', icon: '☠' };
  }
  if (power >= 50) {
    return { label: '低', color: 'var(--accent-poison)', icon: '!' };
  }
  return { label: '微弱', color: 'var(--text-dim)', icon: '-' };
});

// 侦查信息
const scoutInfo = computed(() => {
  if (!location.value) return null;

  // gameStore方法：获取地点的侦查进度信息
  // 返回 { 当前进度: number, 最大进度: number, 百分比: number }
  const progress = store.获取地点侦查进度(location.value.实体ID);

  return {
    progress: progress?.当前进度 ?? 0,
    maxProgress: progress?.最大进度 ?? 100,
    percentage: progress?.百分比 ?? 0,
    isComplete: (progress?.百分比 ?? 0) >= 100,
  };
});

// 已发现的母畜
const discoveredBreedingStock = computed(() => {
  if (!location.value) return [];

  // gameStore方法：获取在该地点已发现的母畜列表
  // 返回 { id: string, name: string, race: string, fertility: number }[]
  return store.获取地点已发现母畜(location.value.实体ID) ?? [];
});

// 未发现的母畜数量
const undiscoveredCount = computed(() => {
  if (!location.value) return null;

  // gameStore方法：获取该地点尚未侦查到的母畜数量
  // 如果完全未侦查，返回 null（显示为 ???）
  return store.获取地点未发现母畜数量(location.value.实体ID);
});

// 地点信息
const locationInfo = computed(() => {
  if (!location.value) return [];
  const info: { label: string; value: string | number }[] = [];

  info.push({ label: '类型', value: location.value.地点类型 });

  const power = location.value.获取战斗力估值?.();
  if (power !== null && power !== undefined) {
    info.push({ label: '战斗力', value: Math.round(power) });
  }

  return info;
});

// 是否已选为战斗目标
const isSelectedAsTarget = computed(() => {
  if (!location.value) return false;
  const combatManager = store.游戏实例?.获取战斗管理器();
  return combatManager?.获取选定目标()?.实体ID === location.value.实体ID;
});

// 是否可攻击
const canAttack = computed(() => {
  if (!location.value) return false;
  const 状态 = location.value.获取属性?.('状态');
  return 状态 !== '已攻占' && 状态 !== '废墟';
});

function selectAsTarget() {
  if (!location.value) return;
  store.选择战斗目标(location.value.实体ID);
}

function deselectTarget() {
  store.游戏实例?.获取战斗管理器()?.取消目标选择();
}

function assignScoutTask() {
  if (!location.value) return;
  // 跳转到任务面板并预选侦查任务
  store.预选任务('侦查', undefined, location.value.实体ID);
  store.切换面板('tasks');
}
</script>

<template>
  <div v-if="location" class="location-detail">
    <!-- 头部 -->
    <div class="detail-header">
      <span class="location-icon">
        {{ typeIconMap[location.地点类型] || typeIconMap['默认'] }}
      </span>
      <div class="header-text">
        <h4 class="detail-title">{{ location.地点名称 }}</h4>
        <span class="location-type">{{ location.地点类型 }}</span>
      </div>
    </div>

    <!-- 威胁等级 -->
    <div v-if="threatLevel" class="threat-display">
      <span class="threat-label">威胁等级:</span>
      <span class="threat-value" :style="{ color: threatLevel.color }">
        <span class="threat-icon">{{ threatLevel.icon }}</span>
        {{ threatLevel.label }}
      </span>
    </div>

    <!-- 侦查进度 -->
    <div class="scout-section">
      <div class="scout-header">
        <span class="scout-title">
          <span class="scout-icon">👁</span>
          侦查进度
        </span>
        <span class="scout-percentage" :class="{ complete: scoutInfo?.isComplete }">
          {{ scoutInfo?.percentage ?? 0 }}%
        </span>
      </div>

      <div class="scout-bar">
        <div
          class="scout-bar__fill"
          :style="{ width: (scoutInfo?.percentage ?? 0) + '%' }"
          :class="{ complete: scoutInfo?.isComplete }"
        />
      </div>

      <div class="scout-detail">
        <span>{{ scoutInfo?.progress ?? 0 }} / {{ scoutInfo?.maxProgress ?? 100 }}</span>
        <button v-if="!scoutInfo?.isComplete" class="btn btn--small" @click="assignScoutTask">派遣侦查</button>
      </div>
    </div>

    <!-- 地点信息 -->
    <div class="info-list">
      <div v-for="info in locationInfo" :key="info.label" class="info-row">
        <span class="info-row__label">{{ info.label }}</span>
        <span class="info-row__value">{{ info.value }}</span>
      </div>
    </div>

    <!-- 发现的母畜 -->
    <div class="broodmother-section">
      <div class="section-header">
        <span class="section-title">🔍 发现的母畜</span>
        <span class="discovery-count">
          {{ discoveredBreedingStock.length }}
          <template v-if="undiscoveredCount !== null">
            / {{ discoveredBreedingStock.length + undiscoveredCount }}
          </template>
          <template v-else> / ??? </template>
        </span>
      </div>

      <div v-if="discoveredBreedingStock.length === 0" class="empty-discovery">
        <span v-if="scoutInfo?.percentage === 0">尚未开始侦查</span>
        <span v-else-if="!scoutInfo?.isComplete">继续侦查以发现更多...</span>
        <span v-else>此地点没有可捕获的母畜</span>
      </div>

      <div v-else class="broodmother-list">
        <div v-for="bm in discoveredBreedingStock" :key="bm.id" class="broodmother-item">
          <div class="bm-main">
            <span class="bm-name">{{ bm.name }}</span>
            <span class="bm-race">{{ bm.race }}</span>
          </div>
          <div class="bm-stats">
            <span class="bm-stat" title="生育力"> ♀ {{ bm.fertility }} </span>
          </div>
        </div>
      </div>

      <!-- 未发现提示 -->
      <div v-if="undiscoveredCount && undiscoveredCount > 0" class="undiscovered-hint">
        <span class="hint-icon">❓</span>
        <span>还有 {{ undiscoveredCount }} 个未发现</span>
      </div>
      <div v-else-if="undiscoveredCount === null && !scoutInfo?.isComplete" class="undiscovered-hint unknown">
        <span class="hint-icon">❓</span>
        <span>未知数量待发现</span>
      </div>
    </div>

    <!-- 状态指示 -->
    <div v-if="isSelectedAsTarget" class="target-indicator">
      <span class="target-icon">⚔</span>
      <span>已选为攻击目标</span>
    </div>

    <!-- 操作区 -->
    <div class="detail-actions">
      <template v-if="canAttack">
        <button v-if="!isSelectedAsTarget" class="btn btn--primary action-btn" @click="selectAsTarget">
          <span>⚔</span> 选为目标
        </button>
        <button v-else class="btn action-btn" @click="deselectTarget">取消选择</button>
      </template>
      <div v-else class="cannot-attack">此地点无法攻击</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.location-detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.location-icon {
  font-size: 24px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: 4px;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.location-type {
  font-size: 12px;
  color: var(--text-dim);
}

.threat-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--bg-secondary);
  border-radius: 2px;
}

.threat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.threat-value {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
}

.threat-icon {
  font-size: 12px;
}

/* 侦查进度样式 */
.scout-section {
  background: var(--bg-secondary);
  border-radius: 3px;
  padding: 10px;
  border: 1px solid var(--border-dark);
}

.scout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.scout-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.scout-icon {
  font-size: 14px;
}

.scout-percentage {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-mana);

  &.complete {
    color: var(--success);
  }
}

.scout-bar {
  height: 6px;
  background: var(--bg-primary);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;

  &__fill {
    height: 100%;
    background: var(--accent-mana);
    transition: width 0.3s ease;
    border-radius: 3px;

    &.complete {
      background: var(--success);
    }
  }
}

.scout-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-dim);
}

/* 母畜发现区域 */
.broodmother-section {
  background: var(--bg-secondary);
  border-radius: 3px;
  padding: 10px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.discovery-count {
  font-size: 12px;
  color: var(--accent-corrupt);
}

.empty-discovery {
  font-size: 12px;
  color: var(--text-dim);
  text-align: center;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 2px;
}

.broodmother-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 100px;
  overflow-y: auto;
}

.broodmother-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: var(--bg-tertiary);
  border-radius: 2px;
}

.bm-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bm-name {
  font-size: 13px;
  color: var(--text-primary);
}

.bm-race {
  font-size: 11px;
  color: var(--text-dim);
}

.bm-stats {
  display: flex;
  gap: 8px;
}

.bm-stat {
  font-size: 12px;
  color: var(--accent-corrupt);
}

.undiscovered-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 6px 8px;
  background: rgba(190, 149, 85, 0.15);
  border-radius: 2px;
  font-size: 12px;
  color: var(--accent-gold);

  &.unknown {
    background: rgba(74, 92, 138, 0.15);
    color: var(--accent-mana);
  }
}

.hint-icon {
  font-size: 14px;
}

/* 原有样式保留 */
.info-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  background: var(--bg-secondary);
  border-radius: 2px;
  font-size: 13px;

  &__label {
    color: var(--text-dim);
  }

  &__value {
    color: var(--text-primary);
  }
}

.target-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  background: rgba(139, 38, 53, 0.2);
  border: 1px solid var(--accent-blood);
  border-radius: 2px;
  font-size: 13px;
  color: var(--accent-blood-light);
}

.target-icon {
  font-size: 14px;
}

.detail-actions {
  margin-top: 4px;
}

.action-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.cannot-attack {
  font-size: 13px;
  color: var(--text-dim);
  text-align: center;
  padding: 8px;
  background: var(--bg-secondary);
  border-radius: 2px;
}
</style>
