<!-- App.vue (更新版) -->
<script setup lang="ts">
import { onMounted } from 'vue';
import { useGameStore } from './stores/gameStore';
import GameHeader from './components/layout/GameHeader.vue';
import GameSidebar from './components/layout/GameSidebar.vue';
import MainContent from './components/layout/MainContent.vue';
import EntityDetailSidebar from './components/sidebar/EntityDetailSidebar.vue';
import TurnSummaryModal from './components/modals/TurnSummaryModal.vue';

const store = useGameStore();

onMounted(() => {
  store.初始化();
});
</script>

<template>
  <div class="game-app" v-if="store.已初始化">
    <GameHeader />
    <div class="game-body">
      <GameSidebar />
      <MainContent />
      <EntityDetailSidebar />
    </div>

    <!-- 通知区域 -->
    <div class="notification-area">
      <TransitionGroup name="notification">
        <div
          v-for="notification in store.通知列表"
          :key="notification.id"
          class="notification"
          :class="`notification--${notification.类型}`"
          @click="store.移除通知(notification.id)"
        >
          {{ notification.消息 }}
        </div>
      </TransitionGroup>
    </div>

    <!-- 回合结算弹窗 -->
    <TurnSummaryModal
      v-if="store.显示回合结算弹窗"
      :summary="store.最新结算摘要"
      @close="store.显示回合结算弹窗 = false"
    />
  </div>

  <div v-else class="loading-screen">
    <div class="loading-content">
      <span class="loading-icon">👹</span>
      <p>正在唤醒哥布林王...</p>
    </div>
  </div>
</template>

<!-- 样式与之前相同 -->
