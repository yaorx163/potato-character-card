<!-- components/panels/SpellPanel.vue -->
<!-- 介绍：法术面板 - 支持倍率释放和目标选择 -->
<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore';
import { computed, ref } from 'vue';

const store = useGameStore();

// 目标选择状态
const selectingTargetFor = ref<string | null>(null);
const selectedTarget = ref<string | null>(null);
const currentMultiplier = ref<number>(1);

// 法术管理器
const spellManager = computed(() => store.游戏实例?.系统管理.获取法术管理器());

interface SpellConfig {
  名称?: string;
  价格?: number;
  描述?: string;
  目标类型?: string | null;
  法术倍率上限?: number;
}

// 所有法术列表
const allSpells = computed(() =>
  spellManager.value?.获取所有法术名().map(name => {
    const config = spellManager.value?.获取法术配置(name) as SpellConfig | undefined;
    return {
      name,
      config,
      needsTarget: config?.目标类型 !== null && config?.目标类型 !== undefined,
      maxMultiplier: config?.法术倍率上限 ?? 1,
    };
  }) ?? []
);

// 当前魔力
const currentMana = computed(() => store.魔力信息.当前);
const maxMana = computed(() => store.魔力信息.最大);

// 当前选择的法术配置
const currentSpellConfig = computed(() => {
  if (!selectingTargetFor.value) return null;
  return allSpells.value.find(s => s.name === selectingTargetFor.value);
});

// 当前法术总消耗
const currentSpellCost = computed(() => {
  if (!currentSpellConfig.value) return 0;
  return (currentSpellConfig.value.config?.价格 ?? 0) * currentMultiplier.value;
});

// 可选目标列表
const availableTargets = computed(() => {
  if (!selectingTargetFor.value || !currentSpellConfig.value?.needsTarget) return [];

  const targetType = currentSpellConfig.value.config?.目标类型;
  const result: { id: string; name: string; type: string; info?: string }[] = [];

  switch (targetType) {
    case '母畜实体':
      store.所有母畜.forEach(m => {
        result.push({
          id: m.实体ID,
          name: m.获取属性('姓名'),
          type: '母畜',
          info: `臣服度: ${m.获取属性('臣服度')} | 淫乱度: ${m.获取属性('淫乱度')}`,
        });
      });
      break;

    case '冠军实体':
      store.所有冠军.forEach(c => {
        result.push({
          id: c.实体ID,
          name: c.获取属性('姓名'),
          type: '冠军',
          info: `战斗力: ${c.获取属性('战斗力')}`,
        });
      });
      break;

    case '可袭击地点实体':
      store.所有地点.forEach(l => {
        const 进度 = store.获取地点侦查进度(l.实体ID);
        result.push({
          id: l.实体ID,
          name: l.地点名称,
          type: '地点',
          info: `侦察: ${进度?.百分比.toFixed(0) ?? 0}%`,
        });
      });
      break;
  }

  return result;
});

// 检查法术并准备施放
function prepareSpell(spellName: string) {
  const spell = allSpells.value.find(s => s.name === spellName);
  if (!spell) return;

  currentMultiplier.value = 1;

  if (spell.needsTarget) {
    selectingTargetFor.value = spellName;
    selectedTarget.value = null;
  } else {
    // 无需目标，直接显示倍率选择（如果有倍率上限 > 1）
    if (spell.maxMultiplier > 1) {
      selectingTargetFor.value = spellName;
      selectedTarget.value = null;
    } else {
      // 直接施放
      castSpell(spellName, 1);
    }
  }
}

// 确认施放法术
function confirmCast() {
  if (!selectingTargetFor.value) return;

  const spell = currentSpellConfig.value;
  if (!spell) return;

  // 检查魔力
  if (currentMana.value < currentSpellCost.value) {
    return;
  }

  // 需要目标但未选择
  if (spell.needsTarget && !selectedTarget.value) {
    return;
  }

  castSpell(selectingTargetFor.value, currentMultiplier.value, selectedTarget.value ?? undefined);
  cancelSelection();
}

// 执行施放
function castSpell(spellName: string, multiplier: number, targetId?: string) {
  store.使用法术(spellName, multiplier, targetId);
}

// 取消选择
function cancelSelection() {
  selectingTargetFor.value = null;
  selectedTarget.value = null;
  currentMultiplier.value = 1;
}

// 调整倍率
function adjustMultiplier(delta: number) {
  if (!currentSpellConfig.value) return;
  const newValue = currentMultiplier.value + delta;
  const maxMult = currentSpellConfig.value.maxMultiplier;
  currentMultiplier.value = Math.max(1, Math.min(maxMult, newValue));
}

// 快捷施放（无目标法术）
function quickCast(spellName: string) {
  const spell = allSpells.value.find(s => s.name === spellName);
  if (!spell || spell.needsTarget) return;

  const cost = spell.config?.价格 ?? 0;
  if (currentMana.value < cost) return;

  castSpell(spellName, 1);
}
</script>

<template>
  <div class="spell-panel">
    <!-- 魔力显示 -->
    <div class="resource-display">
      <span class="resource-icon">◆</span>
      <span class="resource-label">魔力:</span>
      <span class="resource-value">{{ currentMana }} / {{ maxMana }}</span>
      <div class="mana-bar">
        <div
          class="mana-bar__fill"
          :style="{ width: `${(currentMana / maxMana) * 100}%` }"
        ></div>
      </div>
    </div>

    <!-- 法术施放弹层 -->
    <div v-if="selectingTargetFor" class="spell-modal-overlay">
      <div class="spell-modal">
        <div class="modal-header">
          <h4>{{ selectingTargetFor }}</h4>
          <span class="modal-subtitle">{{ currentSpellConfig?.config?.描述 }}</span>
        </div>

        <!-- 倍率选择 -->
        <div class="multiplier-section" v-if="currentSpellConfig && currentSpellConfig.maxMultiplier > 1">
          <div class="multiplier-label">施法倍率</div>
          <div class="multiplier-controls">
            <button
              class="multiplier-btn"
              @click="adjustMultiplier(-1)"
              :disabled="currentMultiplier <= 1"
            >－</button>
            <span class="multiplier-value">{{ currentMultiplier }}x</span>
            <button
              class="multiplier-btn"
              @click="adjustMultiplier(1)"
              :disabled="currentMultiplier >= currentSpellConfig.maxMultiplier"
            >＋</button>
          </div>
          <div class="multiplier-cost">
            消耗: <span :class="{ 'cost-exceeded': currentMana < currentSpellCost }">
              ◆ {{ currentSpellCost }}
            </span>
          </div>
        </div>

        <!-- 目标选择 -->
        <div v-if="currentSpellConfig?.needsTarget" class="target-section">
          <div class="target-label">选择目标</div>
          <div class="target-list">
            <button
              v-for="target in availableTargets"
              :key="target.id"
              class="target-option"
              :class="{ 'target-option--selected': selectedTarget === target.id }"
              @click="selectedTarget = target.id"
            >
              <div class="target-main">
                <span class="target-type">[{{ target.type }}]</span>
                <span class="target-name">{{ target.name }}</span>
              </div>
              <span v-if="target.info" class="target-info">{{ target.info }}</span>
            </button>
            <div v-if="availableTargets.length === 0" class="no-target">
              无可用目标
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="modal-actions">
          <button class="btn" @click="cancelSelection">取消</button>
          <button
            class="btn btn--primary"
            @click="confirmCast"
            :disabled="currentMana < currentSpellCost || (currentSpellConfig?.needsTarget && !selectedTarget)"
          >
            施放 (◆{{ currentSpellCost }})
          </button>
        </div>
      </div>
    </div>

    <!-- 法术列表 -->
    <div class="spell-list">
      <div v-if="allSpells.length === 0" class="empty-hint">
        尚未解锁任何法术
      </div>

      <div
        v-for="spell in allSpells"
        :key="spell.name"
        class="spell-item"
      >
        <div class="spell-item__info">
          <div class="spell-header">
            <span class="spell-name">{{ spell.name }}</span>
            <span v-if="spell.needsTarget" class="needs-target-badge">需目标</span>
            <span v-if="spell.maxMultiplier > 1" class="multiplier-badge">
              {{ spell.maxMultiplier }}x
            </span>
          </div>
          <span class="spell-desc">{{ spell.config?.描述 }}</span>
          <span class="spell-cost">消耗: ◆ {{ spell.config?.价格 }}</span>
        </div>
        <button
          class="btn btn--small btn--magic"
          :disabled="currentMana < (spell.config?.价格 ?? 0)"
          @click="prepareSpell(spell.name)"
        >
          {{ spell.needsTarget || spell.maxMultiplier > 1 ? '准备' : '施放' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.spell-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
}

.resource-display {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 10px;
  background: var(--bg-tertiary);
  border-radius: 3px;

  .resource-icon {
    color: var(--accent-magic, #8b5cf6);
  }

  .resource-label {
    font-size: 13px;
    color: var(--text-secondary);
  }

  .resource-value {
    font-size: 16px;
    font-weight: 600;
    color: var(--accent-magic, #8b5cf6);
  }
}

.mana-bar {
  flex: 1;
  min-width: 100px;
  height: 6px;
  background: var(--bg-secondary);
  border-radius: 3px;
  overflow: hidden;
  margin-left: 8px;

  &__fill {
    height: 100%;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    transition: width 0.3s ease;
  }
}

/* 法术弹层 */
.spell-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: 3px;
}

.spell-modal {
  width: 90%;
  max-width: 320px;
  background: var(--bg-primary);
  border: 1px solid var(--accent-magic, #8b5cf6);
  border-radius: 4px;
  overflow: hidden;
}

.modal-header {
  padding: 10px 12px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
  border-bottom: 1px solid var(--border-dark);

  h4 {
    font-size: 15px;
    font-weight: 600;
    color: var(--accent-magic, #8b5cf6);
    margin: 0;
  }

  .modal-subtitle {
    font-size: 12px;
    color: var(--text-secondary);
  }
}

/* 倍率选择 */
.multiplier-section {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-dark);
  background: var(--bg-secondary);
}

.multiplier-label {
  font-size: 12px;
  color: var(--text-dim);
  margin-bottom: 6px;
}

.multiplier-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.multiplier-btn {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid var(--border-light);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    background: var(--bg-hover);
    border-color: var(--accent-magic, #8b5cf6);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.multiplier-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--accent-magic, #8b5cf6);
  min-width: 40px;
  text-align: center;
}

.multiplier-cost {
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 6px;

  .cost-exceeded {
    color: var(--accent-danger, #ef4444);
  }
}

/* 目标选择 */
.target-section {
  padding: 10px 12px;
}

.target-label {
  font-size: 12px;
  color: var(--text-dim);
  margin-bottom: 6px;
}

.target-list {
  max-height: 160px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.target-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-dark);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  width: 100%;

  &:hover {
    background: var(--bg-hover);
  }

  &--selected {
    background: var(--bg-hover);
    border-color: var(--accent-magic, #8b5cf6);
  }
}

.target-main {
  display: flex;
  align-items: center;
  gap: 6px;
}

.target-type {
  font-size: 11px;
  color: var(--text-dim);
}

.target-name {
  font-size: 13px;
  color: var(--text-primary);
}

.target-info {
  font-size: 11px;
  color: var(--text-dim);
}

.no-target {
  font-size: 13px;
  color: var(--text-dim);
  text-align: center;
  padding: 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-dark);
}

/* 法术列表 */
.spell-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.spell-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  border-left: 2px solid var(--accent-magic, #8b5cf6);

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }
}

.spell-header {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.spell-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.needs-target-badge,
.multiplier-badge {
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 2px;
}

.needs-target-badge {
  background: rgba(190, 149, 85, 0.3);
  color: var(--accent-gold);
}

.multiplier-badge {
  background: rgba(139, 92, 246, 0.3);
  color: var(--accent-magic, #8b5cf6);
}

.spell-desc {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.spell-cost {
  font-size: 11px;
  color: var(--accent-magic, #8b5cf6);
}

.empty-hint {
  font-size: 13px;
  color: var(--text-dim);
  text-align: center;
  padding: 20px;
}

/* 魔法按钮样式 */
.btn--magic {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-color: #8b5cf6;
  color: white;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
  }

  &:disabled {
    background: var(--bg-tertiary);
    border-color: var(--border-dark);
    color: var(--text-dim);
  }
}
</style>
