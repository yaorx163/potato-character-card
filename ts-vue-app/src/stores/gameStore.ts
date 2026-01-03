// stores/gameStore.ts
import { defineStore } from 'pinia';
import { ref, computed, shallowRef } from 'vue';
import { 启动游戏, 获取当前游戏 } from '../game/bootstrap';
import type { 游戏总控 } from '../game/controller';
import type { 冠军实体, 母畜实体, 可袭击地点实体, 领主实体 } from '@/core/entities';
import type { 回合结算摘要, 已发布任务 } from '@/types';

export const useGameStore = defineStore('game', () => {
  // ─── 核心游戏实例 ───
  const 游戏实例 = shallowRef<游戏总控 | null>(null);
  const 已初始化 = ref(false);

  // ─── UI 状态 ───
  const 当前面板 = ref<'dashboard' | 'entities' | 'combat' | 'tasks' | 'spells' | 'market'>('dashboard');
  const 选中实体ID = ref<string | null>(null);
  const 选中实体类型 = ref<'冠军' | '母畜' | '地点' | null>(null);
  const 显示回合结算弹窗 = ref(false);
  const 最新结算摘要 = ref<回合结算摘要 | null>(null);


  // ─── 通知系统 ───
  const 通知列表 = ref<Array<{
    id: number;
    类型: 'success' | 'warning' | 'error' | 'info';
    消息: string;
    时间戳: number;
  }>>([]);
  let 通知计数器 = 0;

  // ─── 初始化游戏 ───
  function 初始化() {
    if (已初始化.value) return;

    const 游戏 = 启动游戏();
    游戏实例.value = 游戏;
    游戏.初始化(游戏.获取工厂管理器());
    已初始化.value = true;

    添加通知('success', '游戏初始化成功！');
  }

  // ─── 计算属性 ───
  const 领主 = computed(() => 游戏实例.value?.获取领主() ?? null);
  const 所有冠军 = computed(() => 游戏实例.value?.获取所有冠军() ?? []);
  const 所有母畜 = computed(() => 游戏实例.value?.获取所有母畜() ?? []);
  const 所有地点 = computed(() => 游戏实例.value?.获取所有地点() ?? []);

  const 当前回合 = computed(() =>
    游戏实例.value?.获取回合管理器().获取当前回合() ?? 0
  );

  const 资源状态 = computed(() =>
    游戏实例.value?.获取资源管理器().获取资源状态() ?? {
      士气: 0,
      最大士气: 100,
      催淫母乳: 0
    }
  );

  const 魔力信息 = computed(() => ({
    当前: 领主.value?.获取属性('魔力') ?? 0,
    最大: 领主.value?.获取属性('最大魔力') ?? 100,
    百分比: 领主.value?.获取魔力百分比() ?? 0
  }));

  const 喽啰总数 = computed(() =>
    游戏实例.value?.喽啰池管理.获取喽啰总数() ?? 0
  );

  const 已发布任务列表 = computed(() =>
    游戏实例.value?.获取任务管理器().获取已发布任务列表() ?? []
  );

  // ─── 选中实体 ───
  const 选中的冠军 = computed(() => {
    if (选中实体类型.value !== '冠军' || !选中实体ID.value) return null;
    return 游戏实例.value?.获取冠军(选中实体ID.value) ?? null;
  });

  const 选中的母畜 = computed(() => {
    if (选中实体类型.value !== '母畜' || !选中实体ID.value) return null;
    return 游戏实例.value?.获取母畜(选中实体ID.value) ?? null;
  });

  const 选中的地点 = computed(() => {
    if (选中实体类型.value !== '地点' || !选中实体ID.value) return null;
    return 游戏实例.value?.获取地点(选中实体ID.value) ?? null;
  });

  // ─── 操作方法 ───
  function 选择实体(实体ID: string, 类型: '冠军' | '母畜' | '地点') {
    选中实体ID.value = 实体ID;
    选中实体类型.value = 类型;
  }

  function 清除选择() {
    选中实体ID.value = null;
    选中实体类型.value = null;
  }

  function 切换面板(面板: typeof 当前面板.value) {
    当前面板.value = 面板;
    清除选择();
  }

  // ─── 任务系统 ───
  function 发布任务(任务名: string, 执行人ID: string, 目标ID?: string) {
    if (!游戏实例.value) return { 成功: false, 原因: '游戏未初始化' };

    const 执行人 = 游戏实例.value.实体管理.获取实体(执行人ID);
    const 目标 = 目标ID ? 游戏实例.value.实体管理.获取实体(目标ID) : null;

    if (!执行人) return { 成功: false, 原因: '执行人不存在' };

    const 结果 = 游戏实例.value.获取任务管理器().发布任务(
      任务名,
      执行人 as any,
      目标 as any
    );

    if (结果.成功) {
      添加通知('success', `任务「${任务名}」已发布`);
    } else {
      添加通知('error', `任务发布失败: ${结果.原因}`);
    }

    return 结果;
  }

  function 取消任务(任务ID: string) {
    if (!游戏实例.value) return;

    const 结果 = 游戏实例.value.获取任务管理器().取消任务(任务ID);
    if (结果.成功) {
      添加通知('info', '任务已取消');
    }
    return 结果;
  }

  // ─── 法术系统 ───
  function 使用法术(法术名: string, 倍率: number, 目标ID?: string) {
    if (!游戏实例.value) return { 成功: false, 原因: '游戏未初始化' };

    const 目标 = 目标ID ? 游戏实例.value.实体管理.获取实体(目标ID) : null;
    const 结果 = 游戏实例.value.获取法术管理器().使用法术(
      法术名,
      倍率,
      目标 as any
    );

    if (结果.成功) {
      添加通知('success', `法术「${法术名}」施放成功`);
    } else {
      添加通知('error', `法术施放失败: ${结果.原因}`);
    }

    return 结果;
  }

  // ─── 黑市系统 ───
  function 购买商品(商品名: string, 数量: number, 目标ID?: string) {
    if (!游戏实例.value) return { 成功: false, 原因: '游戏未初始化' };

    const 目标 = 目标ID ? 游戏实例.value.实体管理.获取实体(目标ID) : null;
    const 结果 = 游戏实例.value.获取黑市管理器().购买商品(
      商品名,
      数量,
      目标 as any
    );

    if (结果.成功) {
      添加通知('success', `成功购买「${商品名}」×${数量}`);
    } else {
      添加通知('error', `购买失败: ${结果.原因}`);
    }

    return 结果;
  }

  function 购买奴隶(商品ID: string) {
    if (!游戏实例.value) return { 成功: false, 原因: '游戏未初始化' };

    const 结果 = 游戏实例.value.获取黑市管理器().购买奴隶(商品ID);

    if (结果.成功) {
      添加通知('success', `成功购买奴隶`);
    } else {
      添加通知('error', `购买失败: ${结果.原因}`);
    }

    return 结果;
  }

  // ─── 战斗系统 ───
  function 选择战斗目标(地点ID: string) {
    if (!游戏实例.value) return { 成功: false };
    return 游戏实例.value.获取战斗管理器().选择目标(地点ID);
  }

  function 添加出战将领(将领ID: string) {
    if (!游戏实例.value) return { 成功: false };
    return 游戏实例.value.获取战斗管理器().添加出战将领(将领ID);
  }

  function 移除出战将领(将领ID: string) {
    if (!游戏实例.value) return { 成功: false };
    return 游戏实例.value.获取战斗管理器().移除出战将领(将领ID);
  }

  function 确认战斗() {
    if (!游戏实例.value) return { 成功: false };
    const 结果 = 游戏实例.value.获取战斗管理器().确认战斗();
    if (结果.成功) {
      添加通知('info', '战斗已确认，将在回合结算时执行');
    }
    return 结果;
  }

  function 获取战斗预览() {
    return 游戏实例.value?.获取战斗管理器().获取战斗预览() ?? null;
  }

  // ─── 回合系统 ───
  function 结束回合() {
    if (!游戏实例.value) return;

    const 摘要:回合结算摘要 = 游戏实例.value.结束回合();
    最新结算摘要.value = 摘要;
    显示回合结算弹窗.value = true;

    添加通知('info', `第 ${摘要.回合数} 回合结束`);

    return 摘要;
  }

  // ─── 通知系统 ───
  function 添加通知(类型: 'success' | 'warning' | 'error' | 'info', 消息: string) {
    const 通知 = {
      id: ++通知计数器,
      类型,
      消息,
      时间戳: Date.now()
    };
    通知列表.value.push(通知);

    // 5秒后自动移除
    setTimeout(() => {
      移除通知(通知.id);
    }, 5000);
  }

  function 移除通知(id: number) {
    const 索引 = 通知列表.value.findIndex(n => n.id === id);
    if (索引 !== -1) {
      通知列表.value.splice(索引, 1);
    }
  }

  // ─── 存档系统 ───
  function 保存游戏(槽位: number) {
    if (!游戏实例.value) return { 成功: false };
    const 结果 = 游戏实例.value.获取存档管理器().保存游戏(游戏实例.value, 槽位);
    if (结果.成功) {
      添加通知('success', '游戏已保存');
    }
    return 结果;
  }

  function 加载游戏(槽位: number) {
    if (!游戏实例.value) return { 成功: false };
    const 结果 = 游戏实例.value.获取存档管理器().加载存档(槽位, 游戏实例.value);
    if (结果.成功) {
      添加通知('success', '游戏已加载');
    }
    return 结果;
  }

  return {
    // 状态
    游戏实例,
    已初始化,
    当前面板,
    选中实体ID,
    选中实体类型,
    显示回合结算弹窗,
    最新结算摘要,
    通知列表,

    // 计算属性
    领主,
    所有冠军,
    所有母畜,
    所有地点,
    当前回合,
    资源状态,
    魔力信息,
    喽啰总数,
    已发布任务列表,
    选中的冠军,
    选中的母畜,
    选中的地点,

    // 方法
    初始化,
    选择实体,
    清除选择,
    切换面板,
    发布任务,
    取消任务,
    使用法术,
    购买商品,
    购买奴隶,
    选择战斗目标,
    添加出战将领,
    移除出战将领,
    确认战斗,
    获取战斗预览,
    结束回合,
    添加通知,
    移除通知,
    保存游戏,
    加载游戏,
  };
});
