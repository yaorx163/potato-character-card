// stores/gameStore.ts
import type { 冠军实体, 可袭击地点实体, 母畜实体, 领主实体 } from '@/core/entities';
import type { 回合结算摘要 } from '@/types';
import { defineStore } from 'pinia';
import { computed, reactive, ref, shallowRef } from 'vue';
import { 启动游戏 } from '../game/bootstrap';
import type { 游戏总控 } from '../game/controller';

interface 任务配置类型 {
  描述?: string;
  行动力消耗?: number;
  需要目标?: boolean;
  目标实体类型?: string | null;
  执行人实体类型?: string | null;
}

// 目标选项类型
interface 目标选项 {
  id: string;
  名称: string;
  类型: string;
  附加信息?: string;
}

// 任务选择状态类型
interface 任务选择状态类型 {
  正在选择: boolean;
  任务名: string | null;
  执行人ID: string | null;
  是否双层选择: boolean;
  当前层级: number; // 0: 第一层（地点），1: 第二层（母畜）
  已选地点ID: string | null;
  已选地点名称: string | null;
  可选目标列表: 目标选项[];
}

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
  const 通知列表 = ref<
    Array<{
      id: number;
      类型: 'success' | 'warning' | 'error' | 'info';
      消息: string;
      时间戳: number;
    }>
  >([]);
  let 通知计数器 = 0;

  // ─── 初始化游戏 ───
  function 初始化() {
    if (已初始化.value) return;

    const 游戏 = 启动游戏();
    游戏实例.value = 游戏;
    已初始化.value = true;

    添加通知('success', '游戏初始化成功！');
  }

  // 为不同类型的实体创建独立的更新标记
  const championsUpdateMarker = ref(0);
  const broodmothersUpdateMarker = ref(0);
  const locationsUpdateMarker = ref(0);
  const generalUpdateMarker = ref(0);
  const 战斗状态 = ref(0);
  const 喽啰状态 = ref(0);

  // ─── 更新方法 ───
  const 更新冠军列表 = () => {
    championsUpdateMarker.value++;
  };

  const 更新母畜列表 = () => {
    broodmothersUpdateMarker.value++;
  };

  const 更新地点列表 = () => {
    locationsUpdateMarker.value++;
  };

  const 更新通用状态 = () => {
    generalUpdateMarker.value++;
  };
  const 更新战斗状态 = () => {
    战斗状态.value++;
  };
  const 更新喽啰状态 = () => {
    喽啰状态.value++;
  };

  const 检查状态更新 = () => {
    championsUpdateMarker.value;
    broodmothersUpdateMarker.value;
    locationsUpdateMarker.value;
    generalUpdateMarker.value;
    战斗状态.value;
    喽啰状态.value;
  };

  // ─── 计算属性 ───
  const 领主 = computed(() => 游戏实例.value?.领主管理.获取领主() ?? null);

  const 所有冠军 = computed(() => {
    检查状态更新();
    return 游戏实例.value?.冠军管理.获取所有冠军() ?? [];
  });

  const 所有母畜 = computed(() => {
    检查状态更新();
    return 游戏实例.value?.母畜管理.获取所有母畜() ?? [];
  });

  const 所有地点 = computed(() => {
    检查状态更新();
    return 游戏实例.value?.地点管理.获取所有地点() ?? [];
  });

  const 当前回合 = computed(() => {
    检查状态更新();
    return 游戏实例.value?.回合管理.获取当前回合() ?? 0;
  });

  const 资源状态 = computed(() => {
    检查状态更新();
    return {
      士气: 游戏实例.value?.资源管理.获取士气() ?? 0,
      最大士气: 游戏实例.value?.资源管理.获取最大士气() ?? 100,
      催淫母乳: 游戏实例.value?.资源管理.获取催淫母乳数量() ?? 0,
    };
  });

  const 魔力信息 = computed(() => {
    检查状态更新();
    return {
      当前: 领主.value?.获取属性('魔力') ?? 0,
      最大: 领主.value?.获取属性('最大魔力') ?? 100,
      百分比: 领主.value?.获取魔力百分比() ?? 0,
    };
  });

  const 喽啰总数 = computed(() => {
    检查状态更新();
    return 游戏实例.value?.喽啰池管理.获取喽啰总数() ?? 0;
  });

  const 已发布任务列表 = computed(() => {
    检查状态更新();
    return 游戏实例.value?.任务管理.获取已发布任务列表() ?? [];
  });

  const 已发现母畜的地点列表 = computed(() => {
    检查状态更新();
    return (
      游戏实例.value?.地点管理.获取所有地点().filter(p => {
        return p.已侦察母畜.size > 0;
      }) ?? []
    );
  });

  // ─── 行动力 ───
  const 最大行动力 = computed(() => {
    检查状态更新();
    return 游戏实例.value?.任务管理.获取最大行动力() ?? 3;
  });
  const 当前行动力 = computed(() => {
    检查状态更新();
    return 游戏实例.value?.任务管理.获取剩余行动力() ?? 3;
  });

  // ─── 选中实体 ───
  const 选中的冠军 = computed(() => {
    检查状态更新();
    if (选中实体类型.value !== '冠军' || !选中实体ID.value) return null;
    return 游戏实例.value?.冠军管理.获取冠军(选中实体ID.value) ?? null;
  });

  const 选中的母畜 = computed(() => {
    检查状态更新();
    if (选中实体类型.value !== '母畜' || !选中实体ID.value) return null;
    return 游戏实例.value?.母畜管理.获取母畜(选中实体ID.value) ?? null;
  });

  const 选中的地点 = computed(() => {
    检查状态更新();
    if (选中实体类型.value !== '地点' || !选中实体ID.value) return null;
    return 游戏实例.value?.地点管理.获取地点(选中实体ID.value) ?? null;
  });

  // ════════════════════════════════════════════════════════════════
  // ████████ 任务选择状态管理（重构） ████████
  // ════════════════════════════════════════════════════════════════

  const 任务选择状态 = reactive<任务选择状态类型>({
    正在选择: false,
    任务名: null,
    执行人ID: null,
    是否双层选择: false,
    当前层级: 0,
    已选地点ID: null,
    已选地点名称: null,
    可选目标列表: [],
  });

  // 重置任务选择状态
  function 重置任务选择状态() {
    任务选择状态.正在选择 = false;
    任务选择状态.任务名 = null;
    任务选择状态.执行人ID = null;
    任务选择状态.是否双层选择 = false;
    任务选择状态.当前层级 = 0;
    任务选择状态.已选地点ID = null;
    任务选择状态.已选地点名称 = null;
    任务选择状态.可选目标列表 = [];
  }

  // 判断任务是否需要双层选择
  function 判断是否双层选择任务(任务名: string): boolean {
    const 配置 = 游戏实例.value?.任务管理.获取任务配置(任务名) as 任务配置类型 | undefined;
    return 配置?.目标实体类型 === '可袭击地点实体-母畜实体';
  }

  // 获取任务的目标实体类型
  function 获取任务目标类型(任务名: string): string | null {
    const 配置 = 游戏实例.value?.任务管理.获取任务配置(任务名) as 任务配置类型 | undefined;
    return 配置?.目标实体类型 ?? null;
  }

  // 根据目标类型构建可选目标列表
  function 构建目标列表(目标类型: string, 执行人ID: string): 目标选项[] {
    const 结果: 目标选项[] = [];

    switch (目标类型) {
      case '冠军实体':
        所有冠军.value
        .filter(m => m.实体ID !== 执行人ID && !游戏实例.value?.任务管理.是否被占用(m.实体ID))
        .forEach(c => {
          结果.push({
            id: c.实体ID,
            名称: c.获取属性('姓名'),
            类型: '冠军',
          });
        });
        break;

      case '母畜实体':
        所有母畜.value
          .filter(m => m.实体ID !== 执行人ID && !游戏实例.value?.任务管理.是否被占用(m.实体ID))
          .forEach(m => {
            结果.push({
              id: m.实体ID,
              名称: m.获取属性('姓名'),
              类型: '母畜',
              附加信息: `臣服度: ${m.获取属性('臣服度')}`,
            });
          });
        break;

      case '地点实体':
        所有地点.value.forEach(l => {
          结果.push({
            id: l.实体ID,
            名称: l.地点名称,
            类型: '地点',
            附加信息: l.地点类型,
          });
        });
        break;

      case '可袭击地点实体':
        所有地点.value.forEach(l => {
          结果.push({
            id: l.实体ID,
            名称: l.地点名称,
            类型: '地点',
            附加信息: l.地点类型,
          });
        });
        break;

      // 双层选择的第一层：已发现母畜的地点
      case '可袭击地点实体-母畜实体':
        已发现母畜的地点列表.value.forEach(l => {
          结果.push({
            id: l.实体ID,
            名称: l.地点名称,
            类型: '地点',
            附加信息: `已发现 ${l.已侦察母畜.size} 名母畜`,
          });
        });
        break;
    }

    return 结果;
  }

  // 构建地点内的母畜目标列表
  function 构建地点母畜列表(地点ID: string): 目标选项[] {
    const 地点 = 游戏实例.value?.地点管理.获取地点(地点ID);
    if (!地点) return [];

    const 结果: 目标选项[] = [];
    地点.已侦察母畜.forEach(母畜 => {
      结果.push({
        id: 母畜.实体ID,
        名称: 母畜.获取属性('姓名'),
        类型: '母畜',
        附加信息: `${母畜.获取属性('种族')} | 魅力: ${母畜.获取属性('魅力')}`,
      });
    });
    return 结果;
  }

  // ═══════════════════════════════════════════════════
  // 开始任务目标选择（统一入口）
  // ═══════════════════════════════════════════════════
  function 开始任务目标选择(任务名: string, 执行人ID: string) {
    const 目标类型 = 获取任务目标类型(任务名);
    if (!目标类型) {
      // 无需目标，直接发布
      发布任务(任务名, 执行人ID);
      return;
    }

    const 是双层 = 判断是否双层选择任务(任务名);

    // 初始化选择状态
    任务选择状态.正在选择 = true;
    任务选择状态.任务名 = 任务名;
    任务选择状态.执行人ID = 执行人ID;
    任务选择状态.是否双层选择 = 是双层;
    任务选择状态.当前层级 = 0;
    任务选择状态.已选地点ID = null;
    任务选择状态.已选地点名称 = null;

    // 构建第一层目标列表
    任务选择状态.可选目标列表 = 构建目标列表(目标类型, 执行人ID);
  }

  // 直接发布无目标任务
  function 直接发布无目标任务(任务名: string, 执行人ID: string) {
    发布任务(任务名, 执行人ID);
  }

  // ═══════════════════════════════════════════════════
  // 选择目标（处理单层和双层选择）
  // ═══════════════════════════════════════════════════
  function 选择目标(目标ID: string) {
    if (!任务选择状态.正在选择 || !任务选择状态.任务名 || !任务选择状态.执行人ID) {
      return;
    }

    // 双层选择且当前是第一层（选地点）
    if (任务选择状态.是否双层选择 && 任务选择状态.当前层级 === 0) {
      const 选中地点 = 任务选择状态.可选目标列表.find(t => t.id === 目标ID);
      if (!选中地点) return;

      // 记录已选地点，进入第二层
      任务选择状态.已选地点ID = 目标ID;
      任务选择状态.已选地点名称 = 选中地点.名称;
      任务选择状态.当前层级 = 1;

      // 构建第二层目标列表（该地点的母畜）
      任务选择状态.可选目标列表 = 构建地点母畜列表(目标ID);
      return;
    }

    // 单层选择 或 双层选择的第二层（选母畜）
    // 最终目标ID就是当前选择的目标
    发布任务(任务选择状态.任务名, 任务选择状态.执行人ID, 目标ID);
    重置任务选择状态();
  }

  // 返回上一层（双层选择专用）
  function 返回上一层选择() {
    if (!任务选择状态.是否双层选择 || 任务选择状态.当前层级 !== 1) {
      return;
    }

    // 回到第一层
    任务选择状态.当前层级 = 0;
    任务选择状态.已选地点ID = null;
    任务选择状态.已选地点名称 = null;

    // 重新构建第一层目标列表
    const 目标类型 = 获取任务目标类型(任务选择状态.任务名!);
    if (目标类型) {
      任务选择状态.可选目标列表 = 构建目标列表(目标类型, 任务选择状态.执行人ID!);
    }
  }

  // 取消任务选择
  function 取消任务选择() {
    重置任务选择状态();
  }

  // 获取当前选择层级标题
  const 当前选择层级标题 = computed(() => {
    if (!任务选择状态.正在选择) return '';

    if (任务选择状态.是否双层选择) {
      if (任务选择状态.当前层级 === 0) {
        return '选择地点';
      } else {
        return `选择母畜 (${任务选择状态.已选地点名称})`;
      }
    }

    return '选择目标';
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

  function 切换面板(panelId: string): void {
    检查状态更新();
    当前面板.value = panelId;
    清除选择();
  }

  // ─── 任务系统 ───
  function 发布任务(任务名: string, 执行人ID: string, 目标ID?: string) {
    更新通用状态();
    if (!游戏实例.value) return { 成功: false, 原因: '游戏未初始化' };

    const 执行人 = 游戏实例.value.实体管理.获取实体(执行人ID);
    const 目标 = 目标ID ? 游戏实例.value.实体管理.获取实体(目标ID) : null;

    if (!执行人) return { 成功: false, 原因: '执行人不存在' };

    const 结果 = 游戏实例.value.任务管理.发布任务(任务名, 执行人 as any, 目标 as any);

    if (结果.成功) {
      添加通知('success', `任务「${任务名}」已发布`);
    } else {
      添加通知('error', `任务发布失败: ${结果.原因}`);
    }

    return 结果;
  }

  function 取消任务(任务ID: string) {
    更新通用状态();
    if (!游戏实例.value) return;

    const 结果 = 游戏实例.value.任务管理.取消任务(任务ID);
    if (结果.成功) {
      添加通知('info', '任务已取消');
    }
    return 结果;
  }

  // ─── 法术系统 ───
  function 使用法术(法术名: string, 倍率: number, 目标ID?: string) {
    更新通用状态();
    if (!游戏实例.value) return { 成功: false, 原因: '游戏未初始化' };

    const 目标 = 目标ID ? 游戏实例.value.实体管理.获取实体(目标ID) : null;
    const 结果 = 游戏实例.value.资源管理.使用法术(法术名, 倍率, 目标 as any);

    if (结果.成功) {
      添加通知('success', `法术「${法术名}」施放成功`);
    } else {
      添加通知('error', `法术施放失败: ${结果.原因}`);
    }

    return 结果;
  }

  // ─── 黑市系统 ───
  function 购买商品(商品名: string, 数量: number, 目标ID?: string) {
    更新通用状态();
    if (!游戏实例.value) return { 成功: false, 原因: '游戏未初始化' };

    const 目标 = 目标ID ? 游戏实例.value.实体管理.获取实体(目标ID) : null;
    const 结果 = 游戏实例.value.资源管理.购买商品(商品名, 数量, 目标 as any);

    if (结果.成功) {
      添加通知('success', `成功购买「${商品名}」×${数量}`);
    } else {
      添加通知('error', `购买失败: ${结果.原因}`);
    }

    return 结果;
  }

  function 购买奴隶(商品ID: string) {
    更新母畜列表();
    if (!游戏实例.value) return { 成功: false, 原因: '游戏未初始化' };

    const 结果 = 游戏实例.value.资源管理.购买奴隶(商品ID);

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
    return 游戏实例.value.战斗管理.选择目标(地点ID);
  }

  function 添加出战将领(将领ID: string) {
    更新冠军列表();
    if (!游戏实例.value) return { 成功: false };
    return 游戏实例.value.战斗管理.添加出战将领(将领ID);
  }

  function 移除出战将领(将领ID: string) {
    更新冠军列表();
    if (!游戏实例.value) return { 成功: false };
    return 游戏实例.value.战斗管理.移除出战将领(将领ID);
  }

  function 确认战斗() {
    if (!游戏实例.value) return { 成功: false };
    const 结果 = 游戏实例.value.战斗管理.确认战斗();
    if (结果.成功) {
      添加通知('info', '战斗已确认，将在回合结算时执行');
    } else {
      添加通知('error', `战斗确认失败: ${结果.原因}`);
    }
    return 结果;
  }

  function 获取战斗预览() {
    return 游戏实例.value?.战斗管理.获取战斗预览() ?? null;
  }

  // ─── 回合系统 ───
  function 结束回合() {
    if (!游戏实例.value) return;

    const 摘要 = 游戏实例.value.回合管理.结束回合();
    最新结算摘要.value = 摘要;
    显示回合结算弹窗.value = true;

    添加通知('info', `第 ${摘要.回合数} 回合结束`);
    更新通用状态();
    return 摘要;
  }

  // ─── 通知系统 ───
  function 添加通知(类型: 'success' | 'warning' | 'error' | 'info', 消息: string) {
    const 通知 = {
      id: ++通知计数器,
      类型,
      消息,
      时间戳: Date.now(),
    };
    通知列表.value.push(通知);

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
    检查状态更新();
    const 游戏实体 = 游戏实例.value?.实体管理.获取实体(id);
    console.log(游戏实体);
    
    switch (游戏实体?.实体类型) {
      case '冠军':
        const 冠军 = 游戏实体 as 冠军实体;
        return 冠军.获取属性('姓名');
      case '母畜':
        const 母畜 = 游戏实体 as 母畜实体;
        return 母畜.获取属性('姓名');
      case '领主':
        const 领主 = 游戏实体 as 领主实体;
        return 领主.获取属性('姓名');
      case '可袭击地点':
        const 地点 = 游戏实体 as 可袭击地点实体;
        return 地点.地点名称;
      default:
        return '未知';
    }
  }

  function 自动分配喽啰(): void {
    更新喽啰状态();
    游戏实例.value?.喽啰池管理.自动分配();
  }

  function 清空将领喽啰(championId: string): void {
    更新喽啰状态();
    游戏实例.value?.喽啰池管理.清空将领喽啰池(championId);
  }

  function 填满将领喽啰(championId: string): void {
    更新喽啰状态();
    游戏实例.value?.喽啰池管理.快速填充到上限(championId);
  }

  function 清空所有喽啰(): void {
    更新喽啰状态();
    游戏实例.value?.喽啰池管理.清空所有将领喽啰池();
  }

  // ========== 任务系统辅助 ==========
  function 检查实体是否有任务(entityId: string): boolean {
    return 游戏实例.value?.任务管理.是否被占用(entityId) ?? false;
  }

  function 预选任务(taskName: string, executorId?: string, targetId?: string): void {
    预选任务名.value = taskName;
    预选执行人ID.value = executorId ?? null;
    预选目标ID.value = targetId ?? null;
  }

  function 清除预选任务(): void {
    预选任务名.value = null;
    预选执行人ID.value = null;
    预选目标ID.value = null;
  }

  function 获取预选任务(): {
    任务名: string | null;
    执行人ID: string | null;
    目标ID: string | null;
  } {
    return {
      任务名: 预选任务名.value,
      执行人ID: 预选执行人ID.value,
      目标ID: 预选目标ID.value,
    };
  }

  // ========== 地点侦查 ==========
  function 获取地点侦查进度(locationId: string): {
    当前进度: number;
    最大进度: number;
    百分比: number;
  } | null {
    检查状态更新();
    const 地点 = 游戏实例.value?.地点管理.获取地点(locationId);
    if (!地点) return null;
    const 当前进度 = 地点.侦察进度;
    const 最大进度 = 地点.侦察最大值;
    return { 当前进度, 最大进度, 百分比: (当前进度 / 最大进度) * 100 };
  }

  function 获取地点已发现母畜(locationId: string): Array<{
    id: string;
    name: string;
    race: string;
    fertility: number;
    appeal: number;
  }> | null {
    检查状态更新();
    const 地点 = 游戏实例.value?.地点管理.获取地点(locationId);
    if (!地点) return null;
    const result: Array<{
      id: string;
      name: string;
      race: string;
      fertility: number;
      appeal: number;
    }> = [];
    地点.已侦察母畜.forEach(母畜 => {
      result.push({
        id: 母畜.实体ID,
        name: 母畜.获取属性('姓名'),
        race: 母畜.获取属性('种族'),
        fertility: 母畜.获取属性('总生育力'),
        appeal: 母畜.获取属性('魅力'),
      });
    });
    return result;
  }

  function 获取地点未发现母畜数量(locationId: string): number | null {
    检查状态更新();
    const 地点 = 游戏实例.value?.地点管理.获取地点(locationId);
    if (!地点) return null;
    return 地点.获取潜在母畜数量();
  }

  // ─── 存档系统 ───
  function 保存游戏() {
    更新通用状态();
    if (!游戏实例.value) return { 成功: false };
    const 结果 = 游戏实例.value.存档管理.保存游戏(游戏实例.value);
    if (结果.成功) {
      添加通知('success', '游戏已保存');
    }
    return 结果;
  }

  function 加载游戏() {
    更新通用状态();
    if (!游戏实例.value) return { 成功: false };
    const 结果 = 游戏实例.value.存档管理.加载存档();
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
    最大行动力,
    当前行动力,

    // 计算属性
    领主,
    所有冠军,
    所有母畜,
    所有地点,
    已发现母畜的地点列表,
    当前回合,
    资源状态,
    魔力信息,
    喽啰总数,
    已发布任务列表,
    选中的冠军,
    选中的母畜,
    选中的地点,

    // 任务选择状态
    任务选择状态,
    当前选择层级标题,

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

    // 任务相关
    发布任务,
    取消任务,
    开始任务目标选择,
    直接发布无目标任务,
    选择目标,
    返回上一层选择,
    取消任务选择,
    检查实体是否有任务,
    预选任务,
    清除预选任务,
    获取预选任务,

    // 其他系统
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
    获取地点侦查进度,
    获取地点已发现母畜,
    获取地点未发现母畜数量,
    保存游戏,
    加载游戏,
  };
});
