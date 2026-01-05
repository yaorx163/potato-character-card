<!-- components/entities/LocationDetail.vue -->
<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore';
import { computed, reactive } from 'vue';

const store = useGameStore();
const location = computed(() => store.选中的地点);

// ═══════════════════════════════════════════════════
// 弹窗状态管理
// ═══════════════════════════════════════════════════
const 弹窗状态 = reactive({
  // 侦查执行人选择
  显示侦查选择: false,

  // 母畜概览
  显示母畜概览: false,
  选中的母畜ID: null as string | null,

  // 劝诱执行人选择
  显示劝诱选择: false,
  劝诱目标ID: null as string | null,
});

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
  return store.获取地点已发现母畜(location.value.实体ID) ?? [];
});

// 未发现的母畜数量
const undiscoveredCount = computed(() => {
  if (!location.value) return null;
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
  return store.游戏实例?.战斗管理?.获取选定目标()?.实体ID === location.value.实体ID;
});

// 是否可攻击
const canAttack = computed(() => {
  if (!location.value) return false;
  const 状态 = location.value.获取属性?.('状态');
  return 状态 !== '已攻占' && 状态 !== '废墟';
});

// ═══════════════════════════════════════════════════
// 可用执行人列表（不忙碌的）
// ═══════════════════════════════════════════════════
const 可用侦查执行人 = computed(() => {
  const 结果: Array<{
    id: string;
    名称: string;
    类型: '冠军' | '母畜';
    附加信息: string;
  }> = [];

  // 添加不忙碌的冠军
  store.所有冠军.forEach(c => {
    if (!store.检查实体是否有任务(c.实体ID)) {
      结果.push({
        id: c.实体ID,
        名称: c.获取属性('姓名'),
        类型: '冠军',
        附加信息: `力量: ${c.获取属性('力量')}`,
      });
    }
  });

  // 添加不忙碌的母畜
  store.所有母畜.forEach(m => {
    if (!store.检查实体是否有任务(m.实体ID)) {
      结果.push({
        id: m.实体ID,
        名称: m.获取属性('姓名'),
        类型: '母畜',
        附加信息: `臣服度: ${m.获取属性('臣服度')}`,
      });
    }
  });

  return 结果;
});

// 可用劝诱执行人（只有母畜）
const 可用劝诱执行人 = computed(() => {
  const 结果: Array<{
    id: string;
    名称: string;
    附加信息: string;
  }> = [];

  store.所有母畜.forEach(m => {
    // 排除目标母畜自身，且不忙碌
    if (m.实体ID !== 弹窗状态.劝诱目标ID && !store.检查实体是否有任务(m.实体ID)) {
      结果.push({
        id: m.实体ID,
        名称: m.获取属性('姓名'),
        附加信息: `臣服度: ${m.获取属性('臣服度')} | 魅力: ${m.获取属性('魅力')}`,
      });
    }
  });

  return 结果;
});

// 选中的母畜详情
const 选中母畜详情 = computed(() => {
  if (!弹窗状态.选中的母畜ID) return null;
  const found = discoveredBreedingStock.value.find(m => m.id === 弹窗状态.选中的母畜ID);
  return found ?? null;
});

// ═══════════════════════════════════════════════════
// 操作方法
// ═══════════════════════════════════════════════════

// 打开侦查选择弹窗
function 打开侦查选择() {
  弹窗状态.显示侦查选择 = true;
}

// 选择侦查执行人
function 选择侦查执行人(执行人: { id: string; 类型: '冠军' | '母畜' }) {
  if (!location.value) return;

  const 任务名 = 执行人.类型 === '冠军' ? '侦察' : '潜入侦察';

  store.发布任务(任务名, 执行人.id, location.value.实体ID);
  弹窗状态.显示侦查选择 = false;
}

// 选为战斗目标并跳转
function selectAsTargetAndNavigate() {
  if (!location.value) return;
  store.选择战斗目标(location.value.实体ID);
  // 跳转到战斗面板
  store.切换面板('combat');
}

function deselectTarget() {
  store.游戏实例?.战斗管理.取消目标选择();
}

// 打开母畜概览
function 打开母畜概览(母畜ID: string) {
  弹窗状态.选中的母畜ID = 母畜ID;
  弹窗状态.显示母畜概览 = true;
}

// 关闭母畜概览
function 关闭母畜概览() {
  弹窗状态.显示母畜概览 = false;
  弹窗状态.选中的母畜ID = null;
}

// 打开劝诱执行人选择
function 打开劝诱选择() {
  弹窗状态.劝诱目标ID = 弹窗状态.选中的母畜ID;
  弹窗状态.显示母畜概览 = false;
  弹窗状态.显示劝诱选择 = true;
}

// 选择劝诱执行人并发布任务
function 选择劝诱执行人(执行人ID: string) {
  if (!弹窗状态.劝诱目标ID) return;

  store.发布任务('潜入劝诱', 执行人ID, 弹窗状态.劝诱目标ID);

  弹窗状态.显示劝诱选择 = false;
  弹窗状态.劝诱目标ID = null;
}

// 关闭所有弹窗
function 关闭侦查选择() {
  弹窗状态.显示侦查选择 = false;
}

function 关闭劝诱选择() {
  弹窗状态.显示劝诱选择 = false;
  弹窗状态.劝诱目标ID = null;
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

    <!-- 侦察进度 -->
    <div class="scout-section">
      <div class="scout-header">
        <span class="scout-title">
          <span class="scout-icon">👁</span>
          侦察进度
        </span>
        <span class="scout-percentage" :class="{ complete: scoutInfo?.isComplete }">
          {{ scoutInfo?.percentage.toFixed(2) ?? 0 }}%
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
        <span>{{ scoutInfo?.progress.toFixed(0) ?? 0 }} / {{ scoutInfo?.maxProgress ?? 100 }}</span>
        <button
          v-if="!scoutInfo?.isComplete"
          class="btn btn--small"
          :disabled="可用侦查执行人.length === 0"
          @click="打开侦查选择"
        >
          派遣侦查
        </button>
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
        <div
          v-for="bm in discoveredBreedingStock"
          :key="bm.id"
          class="broodmother-item broodmother-item--clickable"
          @click="打开母畜概览(bm.id)"
        >
          <div class="bm-main">
            <span class="bm-name">{{ bm.name }}</span>
            <span class="bm-race">{{ bm.race }}</span>
          </div>
          <div class="bm-stats">
            <span class="bm-stat" title="生育力"> ♀ {{ bm.fertility }} </span>
            <span class="bm-stat" title="魅力"> ♥ {{ bm.appeal }} </span>
          </div>
          <span class="bm-arrow">›</span>
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
        <button
          v-if="!isSelectedAsTarget"
          class="btn btn--primary action-btn"
          @click="selectAsTargetAndNavigate"
        >
          <span>⚔</span> 选为目标
        </button>
        <button v-else class="btn action-btn" @click="deselectTarget">取消选择</button>
      </template>
      <div v-else class="cannot-attack">此地点无法攻击</div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- 侦查执行人选择弹窗 -->
  <!-- ═══════════════════════════════════════════════════ -->
  <Teleport to="body">
    <div v-if="弹窗状态.显示侦查选择" class="modal-overlay" @click.self="关闭侦查选择">
      <div class="modal-content">
        <div class="modal-header">
          <h4>选择侦查执行人</h4>
          <span class="modal-subtitle">{{ location?.地点名称 }}</span>
        </div>

        <div class="executor-list">
          <button
            v-for="exec in 可用侦查执行人"
            :key="exec.id"
            class="executor-btn"
            :class="`executor-btn--${exec.类型}`"
            @click="选择侦查执行人(exec)"
          >
            <div class="executor-main">
              <span class="executor-type">[{{ exec.类型 === '冠军' ? '冠军' : '母畜' }}]</span>
              <span class="executor-name">{{ exec.名称 }}</span>
            </div>
            <span class="executor-info">{{ exec.附加信息 }}</span>
            <span class="executor-task">
              → {{ exec.类型 === '冠军' ? '侦察' : '潜入侦察' }}
            </span>
          </button>

          <div v-if="可用侦查执行人.length === 0" class="no-executor">
            没有可用的执行人（全部忙碌中）
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn--small" @click="关闭侦查选择">取消</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- 母畜概览弹窗 -->
  <!-- ═══════════════════════════════════════════════════ -->
  <Teleport to="body">
    <div v-if="弹窗状态.显示母畜概览 && 选中母畜详情" class="modal-overlay" @click.self="关闭母畜概览">
      <div class="modal-content modal-content--broodmother">
        <div class="modal-header">
          <h4>{{ 选中母畜详情.name }}</h4>
          <span class="modal-subtitle">{{ 选中母畜详情.race }}</span>
        </div>

        <div class="broodmother-overview">
          <div class="overview-stats">
            <div class="overview-stat">
              <span class="stat-icon">♀</span>
              <span class="stat-label">生育力</span>
              <span class="stat-value">{{ 选中母畜详情.fertility }}</span>
            </div>
            <div class="overview-stat">
              <span class="stat-icon">♥</span>
              <span class="stat-label">魅力</span>
              <span class="stat-value">{{ 选中母畜详情.appeal }}</span>
            </div>
          </div>

          <div class="overview-hint">
            <span class="hint-icon">💡</span>
            <span>此母畜尚在地点内，需要派遣母畜潜入劝诱</span>
          </div>
        </div>

        <div class="modal-actions modal-actions--spaced">
          <button class="btn btn--small" @click="关闭母畜概览">关闭</button>
          <button
            class="btn btn--primary btn--small"
            :disabled="可用劝诱执行人.length === 0"
            @click="打开劝诱选择"
          >
            <span>🗣</span> 潜入劝诱
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ═══════════════════════════════════════════════════ -->
  <!-- 劝诱执行人选择弹窗 -->
  <!-- ═══════════════════════════════════════════════════ -->
  <Teleport to="body">
    <div v-if="弹窗状态.显示劝诱选择" class="modal-overlay" @click.self="关闭劝诱选择">
      <div class="modal-content">
        <div class="modal-header">
          <h4>选择劝诱执行人</h4>
          <span class="modal-subtitle">
            目标: {{ discoveredBreedingStock.find(m => m.id === 弹窗状态.劝诱目标ID)?.name }}
          </span>
        </div>

        <div class="executor-list">
          <button
            v-for="exec in 可用劝诱执行人"
            :key="exec.id"
            class="executor-btn executor-btn--母畜"
            @click="选择劝诱执行人(exec.id)"
          >
            <div class="executor-main">
              <span class="executor-type">[母畜]</span>
              <span class="executor-name">{{ exec.名称 }}</span>
            </div>
            <span class="executor-info">{{ exec.附加信息 }}</span>
          </button>

          <div v-if="可用劝诱执行人.length === 0" class="no-executor">
            没有可用的母畜执行人
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn--small" @click="关闭劝诱选择">取消</button>
        </div>
      </div>
    </div>
  </Teleport>
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
  max-height: 120px;
  overflow-y: auto;
}

.broodmother-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: var(--bg-tertiary);
  border-radius: 2px;

  &--clickable {
    cursor: pointer;
    transition: all 0.15s;
    border: 1px solid transparent;

    &:hover {
      background: var(--bg-hover);
      border-color: var(--accent-corrupt);
    }
  }
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

.bm-arrow {
  font-size: 16px;
  color: var(--text-dim);
  margin-left: 4px;
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

/* ═══════════════════════════════════════════════════ */
/* 弹窗通用样式 */
/* ═══════════════════════════════════════════════════ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 380px;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  overflow: hidden;

  &--broodmother {
    max-width: 320px;
  }
}

.modal-header {
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-dark);

  h4 {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    margin: 0;
  }

  .modal-subtitle {
    font-size: 11px;
    color: var(--accent-gold);
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-dark);

  &--spaced {
    justify-content: space-between;
  }
}

/* 执行人列表 */
.executor-list {
  padding: 10px;
  max-height: 240px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.executor-btn {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-dark);
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;

  &:hover {
    background: var(--bg-hover);
  }

  &--冠军:hover {
    border-color: var(--accent-blood);
  }

  &--母畜:hover {
    border-color: var(--accent-corrupt);
  }
}

.executor-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.executor-type {
  font-size: 10px;
  color: var(--text-dim);
  padding: 1px 4px;
  background: var(--bg-tertiary);
  border-radius: 2px;
}

.executor-name {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.executor-info {
  font-size: 11px;
  color: var(--text-dim);
}

.executor-task {
  font-size: 11px;
  color: var(--accent-mana);
  font-style: italic;
}

.no-executor {
  font-size: 12px;
  color: var(--text-dim);
  text-align: center;
  padding: 20px;
  background: var(--bg-tertiary);
  border-radius: 2px;
}

/* 母畜概览 */
.broodmother-overview {
  padding: 12px;
}

.overview-stats {
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  background: var(--bg-secondary);
  border-radius: 3px;
  margin-bottom: 10px;
}

.overview-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-icon {
  font-size: 18px;
  color: var(--accent-corrupt);
}

.stat-label {
  font-size: 11px;
  color: var(--text-dim);
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.overview-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px;
  background: rgba(74, 92, 138, 0.15);
  border-radius: 3px;
  font-size: 12px;
  color: var(--accent-mana);
  line-height: 1.4;
}
</style>
