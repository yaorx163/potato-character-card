<!-- components/layout/GameHeader.vue -->
<script setup lang="ts">
import { useGameStore } from '../../stores/gameStore';
import ResourceBar from '../../components/common/ResourceBar.vue';

const store = useGameStore();
</script>

<template>
  <header class="game-header">
    <div class="game-header__left">
      <div class="game-header__logo">
        <span class="logo-icon">👹</span>
        <span class="logo-text">哥布林领地</span>
      </div>
      <div class="game-header__turn">
        第 <span class="turn-number">{{ store.当前回合 }}</span> 回合
      </div>
    </div>

    <div class="game-header__resources">
      <ResourceBar
        label="魔力"
        :current="store.魔力信息.当前"
        :max="store.魔力信息.最大"
        color="accent"
        icon="✦"
      />
      <ResourceBar
        label="士气"
        :current="store.资源状态.士气"
        :max="store.资源状态.最大士气"
        color="success"
        icon="⚔"
      />
      <ResourceBar
        label="母乳"
        :current="store.资源状态.催淫母乳"
        :max="999"
        color="primary"
        icon="🍼"
        :show-max="false"
      />
      <div class="resource-item resource-item--simple">
        <span class="resource-icon">👥</span>
        <span class="resource-label">喽啰</span>
        <span class="resource-value">{{ store.喽啰总数 }}</span>
      </div>
    </div>

    <div class="game-header__right">
      <button class="btn btn--ghost" @click="store.保存游戏(1)">
        💾 保存
      </button>
      <button class="btn btn--accent btn--lg" @click="store.结束回合()">
        ⏭ 结束回合
      </button>
    </div>
  </header>
</template>

<style scoped lang="scss">
@use '../../styles/variables' as *;

.game-header {
  height: $header-height;
  background: linear-gradient(180deg, $bg-medium 0%, $bg-dark 100%);
  border-bottom: 2px solid $border-dark;
  padding: 0 $spacing-xl;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-xl;

  &__left {
    display: flex;
    align-items: center;
    gap: $spacing-xl;
  }

  &__logo {
    display: flex;
    align-items: center;
    gap: $spacing-sm;

    .logo-icon {
      font-size: $font-size-2xl;
    }

    .logo-text {
      font-family: $font-family-base;
      font-size: $font-size-xl;
      font-weight: 700;
      color: $text-highlight;
      letter-spacing: 2px;
    }
  }

  &__turn {
    padding: $spacing-sm $spacing-lg;
    background: $bg-light;
    border: 1px solid $border-medium;
    border-radius: $radius-sm;
    font-size: $font-size-sm;
    color: $text-secondary;

    .turn-number {
      font-size: $font-size-lg;
      font-weight: 700;
      color: $color-accent;
    }
  }

  &__resources {
    display: flex;
    align-items: center;
    gap: $spacing-lg;
    flex: 1;
    justify-content: center;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }
}

.resource-item {
  &--simple {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    background: $bg-light;
    border: 1px solid $border-medium;
    border-radius: $radius-sm;

    .resource-icon {
      font-size: $font-size-lg;
    }

    .resource-label {
      font-size: $font-size-xs;
      color: $text-muted;
    }

    .resource-value {
      font-size: $font-size-lg;
      font-weight: 600;
      color: $text-primary;
    }
  }
}
</style>
