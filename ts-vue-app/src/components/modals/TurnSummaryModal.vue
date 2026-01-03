<!-- components/modals/TurnSummaryModal.vue -->
<!-- 介绍：回合结算弹窗 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()

const summary = computed(() => store.最新结算摘要)

function close() {
  store.显示回合结算弹窗 = false
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="store.显示回合结算弹窗 && summary"
        class="modal-overlay"
        @click.self="close"
      >
        <div class="modal-content">
          <header class="modal-header">
            <h3>第 {{ summary.回合数 }} 回合结算</h3>
            <button class="close-btn" @click="close">×</button>
          </header>

          <div class="modal-body">
            <!-- 任务结果 -->
            <section v-if="summary.任务结算结果.length > 0" class="result-section">
              <h4>任务执行</h4>
              <div
                v-for="task in summary.任务结算结果"
                :key="task.任务ID"
                class="result-item"
                :class="{ 'result-item--success': task.结果.成功, 'result-item--fail': !task.结果.成功 }"
              >
                <span class="result-icon">{{ task.结果.成功 ? '✓' : '✗' }}</span>
                <span class="result-text">
                  {{ task.结果.类型 }}
                  <template v-if="!task.结果.成功">
                    - {{ task.结果.原因 || '失败' }}
                  </template>
                </span>
              </div>
            </section>

            <!-- 法术使用 -->
            <section v-if="summary.法术使用记录" class="result-section">
              <h4>法术施放</h4>
              <div class="result-item result-item--success">
                <span class="result-icon">◆</span>
                <span class="result-text">
                  {{ summary.法术使用记录.法术名 }} × {{ summary.法术使用记录.倍率 }}
                  (消耗 {{ summary.法术使用记录.消耗魔力 }} 魔力)
                </span>
              </div>
            </section>

            <!-- 战斗结果 -->
            <section v-if="summary.战斗结果记录" class="result-section">
              <h4>战斗结果</h4>
              <div
                class="result-item"
                :class="summary.战斗结果记录.胜利 ? 'result-item--success' : 'result-item--fail'"
              >
                <span class="result-icon">⚔</span>
                <span class="result-text">
                  {{ summary.战斗结果记录.胜利 ? '胜利' : '战败' }}
                  <template v-if="summary.战斗结果记录.战损比例">
                    (战损 {{ Math.round(summary.战斗结果记录.战损比例 * 100) }}%)
                  </template>
                </span>
              </div>
            </section>

            <div v-if="summary.任务结算结果.length === 0 && !summary.法术使用记录 && !summary.战斗结果记录" class="empty-result">
              本回合无重要事件
            </div>
          </div>

          <footer class="modal-footer">
            <button class="btn btn--primary" @click="close">
              确认
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-content {
  width: 90%;
  max-width: 360px;
  max-height: 80vh;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-dark);

  h3 {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
  }
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 18px;
  cursor: pointer;

  &:hover {
    color: var(--text-primary);
  }
}

.modal-body {
  padding: 12px;
  overflow-y: auto;
  flex: 1;
}

.result-section {
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }

  h4 {
    font-size: 16px;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 6px;
  }
}

.result-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  margin-bottom: 4px;

  &:last-child {
    margin-bottom: 0;
  }

  &--success {
    .result-icon { color: var(--success); }
  }

  &--fail {
    .result-icon { color: var(--danger); }
  }
}

.result-icon {
  font-size: 16px;
  font-weight: bold;
}

.result-text {
  font-size: 16px;
  color: var(--text-primary);
}

.empty-result {
  font-size: 16px;
  color: var(--text-dim);
  text-align: center;
  padding: 20px;
}

.modal-footer {
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-dark);
  display: flex;
  justify-content: flex-end;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal-content {
    transform: scale(0.95);
  }
}
</style>
