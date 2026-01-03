<!-- components/modals/TurnSummaryModal.vue -->
<script setup lang="ts">
import type { 回合结算摘要 } from '@/types';

const props = defineProps<{
  summary: 回合结算摘要 | null;
}>();

const emit = defineEmits<{
  close: []
}>();
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="emit('close')">
      <div class="modal">
        <div class="modal__header">
          <h2 class="modal__title">第 {{ summary?.回合数 }} 回合结算</h2>
          <button class="modal__close" @click="emit('close')">✕</button>
        </div>

        <div class="modal__content" v-if="summary">
          <!-- 任务结算 -->
          <section class="summary-section" v-if="summary.任务结算结果.length > 0">
            <h3 class="section-title">📋 任务执行结果</h3>
            <div class="result-list">
              <div
                v-for="task in summary.任务结算结果"
                :key="task.任务ID"
                class="result-item"
                :class="{ 'result-item--success': task.结果.成功, 'result-item--fail': !task.结果.成功 }"
              >
                <span class="result-type">{{ task.结果.类型 }}</span>
                <span class="result-status">{{ task.结果.成功 ? '✓ 成功' : '✗ 失败' }}</span>
                <div v-if="task.结果.变化" class="result-changes">
                  <span v-for="(change, key) in task.结果.变化" :key="key" class="change-item">
                    {{ key }}: {{ change[0] }} → {{ change[1] }}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <!-- 法术使用 -->
          <section class="summary-section" v-if="summary.法术使用记录">
            <h3 class="section-title">✨ 法术施放</h3>
            <div class="spell-record">
              <span class="spell-name">{{ summary.法术使用记录.法术名 }}</span>
              <span class="spell-cost">消耗 {{ summary.法术使用记录.消耗魔力 }} 魔力</span>
            </div>
          </section>

          <!-- 战斗结果 -->
          <section class="summary-section" v-if="summary.战斗结果记录">
            <h3 class="section-title">⚔️ 战斗结果</h3>
            <div
              class="combat-result"
              :class="summary.战斗结果记录.胜利 ? 'combat-result--victory' : 'combat-result--defeat'"
            >
              <div class="combat-outcome">
                {{ summary.战斗结果记录.胜利 ? '🎉 胜利！' : '💀 失败...' }}
              </div>
              <div class="combat-stats">
                <span>我方战力: {{ Math.round(summary.战斗结果记录.我方战斗力) }}</span>
                <span>敌方战力: {{ Math.round(summary.战斗结果记录.敌方战斗力) }}</span>
                <span v-if="summary.战斗结果记录.战损比例">
                  战损: {{ Math.round((summary.战斗结果记录.战损比例 ?? 0) * 100) }}%
                </span>
              </div>
              <div v-if="summary.战斗结果记录.俘获母畜?.length" class="combat-loot">
                俘获 {{ summary.战斗结果记录.俘获母畜.length }} 名母畜！
              </div>
            </div>
          </section>

          <!-- 空结算 -->
          <div v-if="summary.任务结算结果.length === 0 && !summary.法术使用记录 && !summary.战斗结果记录" class="empty-summary">
            <p>本回合未执行任何操作</p>
          </div>
        </div>

        <div class="modal__footer">
          <button class="btn btn--accent btn--lg btn--block" @click="emit('close')">
            继续游戏
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '../../styles/variables' as *;

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: $z-modal;
  animation: fadeIn 0.2s ease;
}

.modal {
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  background: $bg-dark;
  border: 2px solid $color-primary;
  border-radius: $radius-lg;
  display: flex;
  flex-direction: column;
  animation: slideInUp 0.3s ease;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-lg $spacing-xl;
    border-bottom: 1px solid $border-dark;
  }

  &__title {
    font-size: $font-size-xl;
    font-weight: 700;
    color: $text-highlight;
  }

  &__close {
    width: 32px;
    height: 32px;
    background: transparent;
    border: 1px solid $border-medium;
    border-radius: 50%;
    color: $text-muted;
    cursor: pointer;
    font-size: $font-size-lg;
    transition: all $transition-fast;

    &:hover {
      border-color: $color-danger;
      color: $color-danger;
    }
  }

  &__content {
    flex: 1;
    padding: $spacing-xl;
    overflow-y: auto;
  }

  &__footer {
    padding: $spacing-lg $spacing-xl;
    border-top: 1px solid $border-dark;
  }
}

.summary-section {
  margin-bottom: $spacing-xl;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: $font-size-base;
  font-weight: 600;
  color: $text-highlight;
  margin-bottom: $spacing-md;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.result-item {
  padding: $spacing-md;
  background: $bg-medium;
  border-radius: $radius-sm;
  border-left: 3px solid;

  &--success {
    border-color: $color-success;
  }

  &--fail {
    border-color: $color-danger;
  }

  .result-type {
    font-weight: 500;
    color: $text-primary;
  }

  .result-status {
    margin-left: $spacing-md;
    font-size: $font-size-sm;
  }

  .result-changes {
    margin-top: $spacing-sm;
    font-size: $font-size-sm;
    color: $text-secondary;

    .change-item {
      display: inline-block;
      margin-right: $spacing-md;
    }
  }
}

.spell-record {
  padding: $spacing-md;
  background: rgba($color-accent, 0.1);
  border: 1px solid $color-accent;
  border-radius: $radius-sm;
  display: flex;
  justify-content: space-between;

  .spell-name {
    font-weight: 500;
    color: $color-accent;
  }

  .spell-cost {
    color: $text-secondary;
  }
}

.combat-result {
  padding: $spacing-lg;
  border-radius: $radius-md;
  text-align: center;

  &--victory {
    background: rgba($color-success, 0.1);
    border: 1px solid $color-success;
  }

  &--defeat {
    background: rgba($color-danger, 0.1);
    border: 1px solid $color-danger;
  }

  .combat-outcome {
    font-size: $font-size-2xl;
    font-weight: 700;
    margin-bottom: $spacing-md;
  }

  .combat-stats {
    display: flex;
    justify-content: center;
    gap: $spacing-lg;
    font-size: $font-size-sm;
    color: $text-secondary;
  }

  .combat-loot {
    margin-top: $spacing-md;
    font-weight: 500;
    color: $color-accent;
  }
}

.empty-summary {
  text-align: center;
  padding: $spacing-2xl;
  color: $text-muted;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
