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
  const 当前面板 = ref<string>('dashboard');
  const 选中实体ID = ref<string | null>(null);
  const 选中实体类型 = ref<'冠军' | '母畜' | '地点' | null>(null);
  const 显示回合结算弹窗 = ref(false);
  const 最新结算摘要 = ref<回合结算摘要 | null>(null);

  const 预选任务名 = ref<string | null>(null);
  const 预选执行人ID = ref<string | null>(null);
  const 预选目标ID = ref<string | null>(null);

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


  // 为不同类型的实体创建独立的更新标记
  const championsUpdateMarker = ref(0)
  const broodmothersUpdateMarker = ref(0)
  const locationsUpdateMarker = ref(0)
  const generalUpdateMarker = ref(0)
  const 战斗状态 = ref(0)
  const 喽啰状态 = ref(0)
  // ─── 更新方法 ───
  const 更新冠军列表 = () => {
    championsUpdateMarker.value++
  }

  const 更新母畜列表 = () => {
    broodmothersUpdateMarker.value++
  }

  const 更新地点列表 = () => {
    locationsUpdateMarker.value++
  }

  const 更新通用状态 = () => {
    generalUpdateMarker.value++
  }
  const 更新战斗状态 = () => {
    战斗状态.value++
  }
  const 更新喽啰状态 = () => {
    喽啰状态.value++
  }

  const 检查状态更新 = () => {
    championsUpdateMarker.value
    broodmothersUpdateMarker.value
    locationsUpdateMarker.value
    generalUpdateMarker.value
    战斗状态.value
    喽啰状态.value
  }

  // ─── 计算属性 ───
  const 领主 = computed(() => 游戏实例.value?.获取领主() ?? null);

  const 所有冠军 = computed(() => {
    检查状态更新()
    return 游戏实例.value?.获取所有冠军() ?? []
  });

  const 所有母畜 = computed(() => {
    检查状态更新()
    return 游戏实例.value?.获取所有母畜() ?? []
  });

  const 所有地点 = computed(() => {
    检查状态更新()
    return 游戏实例.value?.获取所有地点() ?? []
  });

  const 当前回合 = computed(() => {
    检查状态更新()
    return 游戏实例.value?.获取回合管理器().获取当前回合() ?? 0
  });

  const 资源状态 = computed(() => {
    检查状态更新()
    return 游戏实例.value?.获取资源管理器().获取资源状态() ?? {
      士气: 0,
      最大士气: 100,
      催淫母乳: 0
    }
  });

  const 魔力信息 = computed(() => {
    检查状态更新()
    return {
      当前: 领主.value?.获取属性('魔力') ?? 0,
      最大: 领主.value?.获取属性('最大魔力') ?? 100,
      百分比: 领主.value?.获取魔力百分比() ?? 0
    }
  });

  const 喽啰总数 = computed(() => {
    检查状态更新()
    return 游戏实例.value?.喽啰池管理.获取喽啰总数() ?? 0
  });

  const 已发布任务列表 = computed(() => {
    检查状态更新()
    return 游戏实例.value?.获取任务管理器().获取已发布任务列表() ?? []
  });

  // ─── 选中实体 ───
  const 选中的冠军 = computed(() => {
    检查状态更新()
    if (选中实体类型.value !== '冠军' || !选中实体ID.value) return null;
    return 游戏实例.value?.获取冠军(选中实体ID.value) ?? null;
  });

  const 选中的母畜 = computed(() => {
    检查状态更新()
    if (选中实体类型.value !== '母畜' || !选中实体ID.value) return null;
    return 游戏实例.value?.获取母畜(选中实体ID.value) ?? null;
  });

  const 选中的地点 = computed(() => {
    检查状态更新()
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

  function 切换面板(panelId: string): void{
    检查状态更新()
    当前面板.value = panelId;
    清除选择();
  }

  // ─── 任务系统 ───
  function 发布任务(任务名: string, 执行人ID: string, 目标ID?: string) {
    更新通用状态()
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
    更新通用状态() // 使用通用更新
    if (!游戏实例.value) return;

    const 结果 = 游戏实例.value.获取任务管理器().取消任务(任务ID);
    if (结果.成功) {
      添加通知('info', '任务已取消');
    }
    return 结果;
  }

  // ─── 法术系统 ───
  function 使用法术(法术名: string, 倍率: number, 目标ID?: string) {
    更新通用状态() // 使用通用更新
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
    更新通用状态() // 使用通用更新
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
    更新母畜列表()
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
    更新冠军列表()
    if (!游戏实例.value) return { 成功: false };
    return 游戏实例.value.获取战斗管理器().添加出战将领(将领ID);
  }

  function 移除出战将领(将领ID: string) {
    更新冠军列表()
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
    更新通用状态() // 使用通用更新
    if (!游戏实例.value) return;

    const 摘要 = 游戏实例.value.结束回合();
    最新结算摘要.value = 摘要;
    显示回合结算弹窗.value = true;

    添加通知('info', `第 ${摘要.回合数} 回合结束`);

    return 摘要;
  }

  // ─── 通知系统 ───
  function 添加通知(类型: 'success' | 'warning' | 'error' | 'info', 消息: string) {
    // 移除对更新标记的调用，避免递归
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

  function 获取姓名(id: string): string {
    const 游戏实体 = 游戏实例.value?.实体管理.获取实体(id)
    switch (游戏实体?.实体类型) {
      case '冠军实体':
        const 冠军 = 游戏实体 as 冠军实体
        return 冠军.获取属性('姓名')
      case '母畜实体':
        const 母畜 = 游戏实体 as 母畜实体
        return 母畜.获取属性('姓名')
      case '领主实体':
        const 领主 = 游戏实体 as 领主实体
        return 领主.获取属性('姓名')
      default:
        return '未知'
    }
  }

  function 自动分配喽啰(): void {
    更新喽啰状态()
    const 结果 = 游戏实例.value?.喽啰池管理.自动分配()
  }

  function 清空将领喽啰(championId: string): void {
    更新喽啰状态()
    游戏实例.value?.获取实体管理器().清空将领喽啰池(championId)
  }

  function 填满将领喽啰(championId: string): void {
    更新喽啰状态()
    游戏实例.value?.获取实体管理器().快速填充到上限(championId)
  }

  function 清空所有喽啰(): void{
    更新喽啰状态()
    游戏实例.value?.喽啰池管理.清空所有将领喽啰池()
  }

  // ========== 任务系统 ==========

  function 检查实体是否有任务(entityId: string): boolean{
    return 游戏实例.value?.获取任务管理器().是否被占用(entityId) ?? false
  }

  /**
   * 预选任务（用于从其他界面跳转到任务面板时预填充）
   * @param taskName 任务名称
   * @param executorId 执行人ID（可选）
   * @param targetId 目标ID（可选）
   */
  function 预选任务(taskName: string, executorId?: string, targetId?: string): void {
    预选任务名.value = taskName;
    预选执行人ID.value = executorId ?? null;
    预选目标ID.value = targetId ?? null;
  }

  /**
   * 清除预选任务状态（在任务面板消费后调用）
   */
  function 清除预选任务(): void {
    预选任务名.value = null;
    预选执行人ID.value = null;
    预选目标ID.value = null;
  }

  /**
   * 获取预选任务信息
   */
  function 获取预选任务(): {
    任务名: string | null;
    执行人ID: string | null;
    目标ID: string | null;
  } {
    return {
      任务名: 预选任务名.value,
      执行人ID: 预选执行人ID.value,
      目标ID: 预选目标ID.value
    };
  }

  // ========== 地点侦查 ==========

  /**
   * 获取地点侦查进度
   * @param locationId 地点实体ID
   * @returns { 当前进度: number, 最大进度: number, 百分比: number } | null
   */
  function 获取地点侦查进度(locationId: string): {
    当前进度: number
    最大进度: number
    百分比: number
  } | null{
    检查状态更新()
    const 地点 = 游戏实例.value?.获取实体管理器().获取地点(locationId)
    if (!地点) return null
    const 当前进度 = 地点.侦察进度
    const 最大进度 = 地点.侦察最大值
    return { 当前进度, 最大进度, 百分比: 当前进度 / 最大进度 }
  }

  /**
   * 获取地点已发现的母畜列表
   * @param locationId 地点实体ID
   * @returns 已发现母畜信息数组
   */
  function 获取地点已发现母畜(locationId: string): Array<{
    id: string
    name: string
    race: string
    fertility: number
    appeal: number
  }> | null{
    检查状态更新()
    const 地点 = 游戏实例.value?.获取实体管理器().获取地点(locationId)
    if (!地点) return null
    const reslut: Array<{
      id: string
      name: string
      race: string
      fertility: number
      appeal: number
    }> = []
    地点.已侦察母畜.forEach(母畜 => {
      reslut.push({
        id: 母畜.实体ID,
        name: 母畜.获取属性('姓名'),
        race: 母畜.获取属性('种族'),
        fertility: 母畜.获取属性('总生育力'),
        appeal: 母畜.获取属性('魅力'),
      })
    })
    return reslut;
  }

  /**
   * 获取地点未发现的母畜数量
   * @param locationId 地点实体ID
   * @returns 未发现数量，如果完全未侦查返回 null
   */
  function 获取地点未发现母畜数量(locationId: string): number | null{
    检查状态更新()
    const 地点 = 游戏实例.value?.获取实体管理器().获取地点(locationId)
    if (!地点) return null
    return 地点.获取潜在母畜数量();
  }

  // ─── 存档系统 ───
  function 保存游戏(槽位: number) {
    更新通用状态() // 使用通用更新
    if (!游戏实例.value) return { 成功: false };
    const 结果 = 游戏实例.value.获取存档管理器().保存游戏(游戏实例.value, 槽位);
    if (结果.成功) {
      添加通知('success', '游戏已保存');
    }
    return 结果;
  }

  function 加载游戏(槽位: number) {
    更新通用状态() // 使用通用更新
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
    预选任务名,
    预选执行人ID,
    预选目标ID,

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
    更新冠军列表,
    更新母畜列表,
    更新地点列表,
    更新通用状态,
    检查状态更新,
    选择实体,
    获取姓名,
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
    自动分配喽啰,
    清空将领喽啰,
    填满将领喽啰,
    清空所有喽啰,
    检查实体是否有任务,
    预选任务,
    清除预选任务,
    获取预选任务,
    获取地点侦查进度,
    获取地点已发现母畜,
    获取地点未发现母畜数量,
    保存游戏,
    加载游戏,
  };
});


// 购买商品,
// 切换面板,
