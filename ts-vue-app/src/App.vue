<script setup lang="ts">
import { 启动游戏, 获取当前游戏 } from "./game/bootstrap";

启动游戏();
const 当前游戏 = 获取当前游戏();
if (当前游戏) {
  console.log("当前游戏:", 当前游戏);
}

</script>

<template>
  
</template>

<style scoped>

</style>
