<!-- components/panels/EntityPanel.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGameStore } from '../../stores/gameStore';
import ChampionCard from '../../components/entities/ChampionCard.vue';
import BreederCard from '../../components/entities/BreederCard.vue';
import LocationCard from '../../components/entities/LocationCard.vue';

const store = useGameStore();

type TabType = 'champions' | 'breeders' | 'locations';
const currentTab = ref<TabType>('champions');

const tabs = [
  { id: 'champions' as const, label: '冠军', icon: '👺', count: computed(() => store.所有冠军.length) },
  { id: 'breeders' as const, label: '母畜', icon: '👩', count: computed(() => store.所有母畜.length) },
  { id: 'locations' as const, label: '地点', icon: '🏘️', count: computed(() => store.所有地点.length) },
];

function isChampionBusy(championId: string): boolean {
  return store.游戏实例?.获取任务管理器().执行人是否被占用(championId) ?? false;
}

function isBreederBusy(breederId: string): boolean {
  return store.游戏实例?.获取任务管理器().执行人是否被占用(breederId) ?? false;
}
</script>

<template>
  <div class="entity-panel">
    <div class="panel panel--elevated">
      <div class="panel__header">
        <h2 class="panel__title">实体管理</h2>
        <div class="tab-nav">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ 'tab-btn--active': currentTab === tab.id }"
            @click="currentTab = tab.id"
          >
            <span class="tab-btn__icon">{{ tab.icon }}</span>
            <span class="tab-btn__label">{{ tab.label }}</span>
            <span class="tab-btn__count">{{ tab.count.value }}</span>
          </button>
        </div>
      </div>

      <div class="panel__content">
        <!-- 冠军列表 -->
        <Transition name="fade" mode="out-in">
          <div v-if="currentTab === 'champions'" key="champions" class="entity-grid">
            <ChampionCard
              v-for="champion in store.所有冠军"
              :key="champion.实体ID"
              :champion="champion"
              :selected="store.选中实体ID === champion.实体ID"
              :busy="isChampionBusy(champion.实体ID)"
              @select="store.选择实体(champion.实体ID, '冠军')"
            />
            <div v-if="store.所有冠军.length === 0" class="empty-state">
              <span class="empty-icon">👺</span>
              <p>暂无冠军</p>
              <p class="empty-hint">通过母畜生育获取冠军</p>
            </div>
          </div>

          <!-- 母畜列表 -->
          <div v-else-if="currentTab === 'breeders'" key="breeders" class="entity-grid">
            <BreederCard
              v-for="breeder in store.所有母畜"
              :key="breeder.实体ID"
              :breeder="breeder"
              :selected="store.选中实体ID === breeder.实体ID"
              :busy="isBreederBusy(breeder.实体ID)"
              @select="store.选择实体(breeder.实体ID, '母畜')"
            />
            <div v-if="store.所有母畜.length === 0" class="empty-state">
              <span class="empty-icon">👩</span>
              <p>暂无母畜</p>
              <p class="empty-hint">通过袭击或黑市获取母畜</p>
            </div>
          </div>

          <!-- 地点列表 -->
          <div v-else-if="currentTab === 'locations'" key="locations" class="entity-grid">
            <LocationCard
              v-for="location in store.所有地点"
              :key="location.实体ID"
              :location="location"
              :selected="store.选中实体ID === location.实体ID"
              @select="store.选择实体(location.实体ID, '地点')"
            />
            <div v-if="store.所有地点.length === 0" class="empty-state">
              <span class="empty-icon">🏘️</span>
              <p>暂无可袭击地点</p>
              <p class="empty-hint">探索新区域发现目标</p>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables' as *;

.entity-panel {
  height: 100%;
}

.tab-nav {
  display: flex;
  gap: $spacing-sm;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-lg;
  background: transparent;
  border: 1px solid $border-medium;
  border-radius: $radius-sm;
  color: $text-secondary;
  cursor: pointer;
  transition: all $transition-fast;
  font-family: $font-family-ui;

  &:hover {
    border-color: $color-primary;
    color: $text-primary;
  }

  &--active {
    background: rgba($color-primary, 0.15);
    border-color: $color-primary;
    color: $text-highlight;
  }

  &__icon {
    font-size: $font-size-lg;
  }

  &__label {
    font-size: $font-size-sm;
    font-weight: 500;
  }

  &__count {
    min-width: 24px;
    height: 24px;
    padding: 0 $spacing-sm;
    background: $bg-light;
    border-radius: 12px;
    font-size: $font-size-xs;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.entity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: $spacing-lg;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-2xl;
  color: $text-muted;

  .empty-icon {
    font-size: 4rem;
    opacity: 0.3;
    margin-bottom: $spacing-lg;
  }

  p {
    margin: 0;
    font-size: $font-size-lg;
  }

  .empty-hint {
    font-size: $font-size-sm;
    margin-top: $spacing-sm;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity $transition-fast;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
