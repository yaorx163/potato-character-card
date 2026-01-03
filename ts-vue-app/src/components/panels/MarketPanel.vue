<!-- components/panels/MarketPanel.vue -->
<!-- 介绍：黑市面板 - 改进版，支持购买时选择目标 -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()

type MarketTab = 'goods' | 'slaves'
const activeTab = ref<MarketTab>('goods')

// 目标选择状态
const selectingTargetFor = ref<string | null>(null) // 商品名或奴隶ID
const selectedTarget = ref<string | null>(null)

const marketManager = computed(() => store.游戏实例?.获取黑市管理器())

interface GoodsConfig {
  价格?: number
  描述?: string
  需要目标?: boolean
  目标类型?: string[]
  每回合限购?: number
}

const allGoods = computed(() =>
  marketManager.value?.获取所有商品名().map(name => {
    const config = marketManager.value?.获取商品配置(name) as GoodsConfig | undefined
    return {
      name,
      config,
      remaining: marketManager.value?.获取商品可购买数量(name) ?? 0,
      needsTarget: config?.需要目标 ?? false
    }
  }) ?? []
)

const slaves = computed(() =>
  marketManager.value?.获取奴隶货架() ?? []
)

const currentMilk = computed(() => store.资源状态.催淫母乳)

// 获取可选目标列表
const availableTargets = computed(() => {
  if (!selectingTargetFor.value) return []

  // 尝试获取商品配置
  const goods = allGoods.value.find(g => g.name === selectingTargetFor.value)
  const targetTypes = goods?.config?.目标类型 ?? ['母畜实体', '冠军实体']

  const result: { id: string; name: string; type: string; info?: string }[] = []

  if (targetTypes.includes('母畜实体')) {
    store.所有母畜.forEach(m => {
      result.push({
        id: m.实体ID,
        name: m.获取属性('姓名'),
        type: '母畜',
        info: `臣服度: ${m.获取属性('臣服度')}`
      })
    })
  }

  if (targetTypes.includes('冠军实体')) {
    store.所有冠军.forEach(c => {
      result.push({
        id: c.实体ID,
        name: c.获取属性('姓名'),
        type: '冠军'
      })
    })
  }

  if (targetTypes.includes('地点实体')) {
    store.所有地点.forEach(l => {
      result.push({
        id: l.实体ID,
        name: l.地点名称,
        type: '地点'
      })
    })
  }

  return result
})

// 检查商品是否需要目标
function checkAndBuyGoods(goodsName: string) {
  const goods = allGoods.value.find(g => g.name === goodsName)
  if (goods?.needsTarget) {
    selectingTargetFor.value = goodsName
    selectedTarget.value = null
  } else {
    store.购买商品(goodsName, 1)
  }
}

// 确认购买（带目标）
function confirmPurchase() {
  if (!selectingTargetFor.value) return

  // gameStore方法：购买商品并指定目标
  store.购买商品(selectingTargetFor.value, 1, selectedTarget.value ?? undefined)

  selectingTargetFor.value = null
  selectedTarget.value = null
}

// 取消选择
function cancelSelection() {
  selectingTargetFor.value = null
  selectedTarget.value = null
}

function buySlave(slaveId: string) {
  store.购买奴隶(slaveId)
}
</script>

<template>
  <div class="market-panel">
    <!-- 当前资源 -->
    <div class="resource-display">
      <span class="resource-icon">✦</span>
      <span class="resource-label">催淫母乳:</span>
      <span class="resource-value">{{ currentMilk }}</span>
    </div>

    <!-- 目标选择弹层 -->
    <div v-if="selectingTargetFor" class="target-selection-overlay">
      <div class="target-selection-modal">
        <div class="modal-header">
          <h4>选择使用目标</h4>
          <span class="modal-subtitle">{{ selectingTargetFor }}</span>
        </div>

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

        <div class="modal-actions">
          <button class="btn" @click="cancelSelection">取消</button>
          <button
            class="btn btn--primary"
            @click="confirmPurchase"
            :disabled="!selectedTarget"
          >
            确认购买
          </button>
        </div>
      </div>
    </div>

    <!-- 子标签 -->
    <div class="market-tabs">
      <button
        class="market-tab"
        :class="{ 'market-tab--active': activeTab === 'goods' }"
        @click="activeTab = 'goods'"
      >
        常驻商品
      </button>
      <button
        class="market-tab"
        :class="{ 'market-tab--active': activeTab === 'slaves' }"
        @click="activeTab = 'slaves'"
      >
        奴隶 ({{ slaves.length }})
      </button>
    </div>

    <!-- 商品列表 -->
    <div v-if="activeTab === 'goods'" class="goods-list">
      <div
        v-for="goods in allGoods"
        :key="goods.name"
        class="goods-item"
      >
        <div class="goods-item__info">
          <div class="goods-header">
            <span class="goods-name">{{ goods.name }}</span>
            <span v-if="goods.needsTarget" class="needs-target-badge">需目标</span>
          </div>
          <span class="goods-desc">{{ goods.config?.描述 }}</span>
          <span class="goods-meta">
            价格: {{ goods.config?.价格 }} · 剩余: {{ goods.remaining === Infinity ? '∞' : goods.remaining }}
          </span>
        </div>
        <button
          class="btn btn--small"
          :disabled="currentMilk < (goods.config?.价格 ?? 0) || goods.remaining <= 0"
          @click="checkAndBuyGoods(goods.name)"
        >
          {{ goods.needsTarget ? '选择目标' : '购买' }}
        </button>
      </div>
    </div>

    <!-- 奴隶列表 -->
    <div v-else class="slave-list">
      <div v-if="slaves.length === 0" class="empty-hint">
        本周无奴隶出售
      </div>

      <div
        v-for="slave in slaves"
        :key="slave.商品ID"
        class="slave-item"
      >
        <div class="slave-item__info">
          <span class="slave-name">{{ slave.母畜实体.获取属性('姓名') }}</span>
          <span class="slave-detail">
            {{ slave.母畜实体.获取属性('种族') }} ·
            {{ slave.母畜实体.获取属性('原身份') }}
          </span>
          <span class="slave-stats">
            育力: {{ slave.母畜实体.获取属性('总生育力') }} ·
            魅力: {{ slave.母畜实体.获取属性('魅力') }}
          </span>
        </div>
        <div class="slave-item__action">
          <span class="slave-price">✦ {{ slave.价格 }}</span>
          <button
            class="btn btn--small btn--primary"
            :disabled="currentMilk < slave.价格"
            @click="buySlave(slave.商品ID)"
          >
            购买
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.market-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
}

.resource-display {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: var(--bg-tertiary);
  border-radius: 3px;

  .resource-icon {
    color: var(--accent-corrupt);
  }

  .resource-label {
    font-size: 13px;
    color: var(--text-secondary);
  }

  .resource-value {
    font-size: 16px;
    font-weight: 600;
    color: var(--accent-corrupt);
  }
}

/* 目标选择弹层 */
.target-selection-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: 3px;
}

.target-selection-modal {
  width: 90%;
  max-width: 300px;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  overflow: hidden;
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
    font-size: 12px;
    color: var(--accent-gold);
  }
}

.target-list {
  padding: 10px;
  max-height: 200px;
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
    border-color: var(--accent-corrupt);
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

.market-tabs {
  display: flex;
  gap: 4px;
}

.market-tab {
  flex: 1;
  padding: 6px;
  border: 1px solid var(--border-dark);
  border-radius: 2px;
  background: var(--bg-tertiary);
  color: var(--text-dim);
  font-size: 13px;
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
}

.goods-list,
.slave-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.goods-item,
.slave-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  background: var(--bg-tertiary);
  border-radius: 3px;

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }
}

.goods-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.goods-name,
.slave-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.needs-target-badge {
  font-size: 10px;
  padding: 1px 4px;
  background: rgba(190, 149, 85, 0.3);
  color: var(--accent-gold);
  border-radius: 2px;
}

.goods-desc {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.goods-meta {
  font-size: 11px;
  color: var(--text-dim);
}

.slave-detail {
  font-size: 12px;
  color: var(--text-secondary);
}

.slave-stats {
  font-size: 11px;
  color: var(--text-dim);
}

.slave-item__action {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.slave-price {
  font-size: 13px;
  color: var(--accent-corrupt);
  font-weight: 500;
}

.empty-hint {
  font-size: 13px;
  color: var(--text-dim);
  text-align: center;
  padding: 20px;
}
</style>
