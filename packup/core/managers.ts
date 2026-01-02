// ═══════════════════════════════════════════════════════════════
// core/managers.ts
// 游戏系统管理器 - 任务、法术、黑市调度层
// ═══════════════════════════════════════════════════════════════

import { 冠军实体, 母畜实体, 可袭击地点实体, 领主实体, 喽啰池, 实体基类 } from './entities';

import { 工厂管理器 } from './factories';

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

type 可执行实体 = 冠军实体 | 母畜实体;
type 可目标实体 = 母畜实体 | 可袭击地点实体 | 喽啰池 | null;
type 武装等级 = '未武装' | '低级武装' | '中级武装' | '高级武装' | '精英武装';


interface 任务前置条件 {
  (执行人: 可执行实体): boolean;
}

interface 任务执行效果结果 {
  成功: boolean;
  类型: string;
  执行人: 可执行实体;
  目标: 可目标实体;
  变化?: Record<string, [number | string, number | string]>;
  已侦察母畜?: 母畜实体[];
  已获取母畜?: 母畜实体[];
  已获取冠军?: 冠军实体[];
  原因?: string;
}

interface 任务配置 {
  名称: string;
  描述: string;
  前置条件?: 任务前置条件[];
  行动力占用?: (执行人: 可执行实体) => number;
  执行效果: (执行人: 可执行实体, 目标: 可目标实体, 游戏总控?: 游戏总控接口) => 任务执行效果结果;
}

interface 已发布任务 {
  任务ID: string;
  任务名: string;
  执行人ID: string;
  目标ID: string | null;
  行动力占用: number;
  发布时间: number;
}

interface 任务结算结果 {
  任务ID: string;
  结果: 任务执行效果结果;
}

// ─── 法术类型 ───

interface 法术执行效果结果 {
  成功: boolean;
  类型: string;
  目标: 可目标实体 | 母畜实体;
  变化?: Record<string, [number | string, number | string]>;
}

interface 法术配置 {
  名称: string;
  价格: number;
  法术倍率上限: number;
  执行效果: (法术倍率: number, 目标: 可目标实体 | 母畜实体, 游戏总控: 游戏总控接口) => 法术执行效果结果;
}

interface 法术使用记录 {
  法术名: string;
  倍率: number;
  消耗魔力: number;
  目标ID: string | null;
}

// ─── 黑市类型 ───

interface 商品执行效果结果 {
  成功: boolean;
  类型: string;
  目标: 可目标实体 | 母畜实体 | null;
  信息?: string;
  变化?: Record<string, [number | string, number | string]>;
}

interface 商品配置 {
  名称: string;
  价格: number;
  描述?: string;
  每周限购: number;
  执行效果: (购买数量: number, 目标: 可目标实体 | 母畜实体 | null, 游戏总控: 游戏总控接口) => 商品执行效果结果;
}

interface 商品实例 {
  商品ID: string;
  配置: 商品配置;
  本周已购买: number;
}

interface 奴隶商品 {
  商品ID: string;
  母畜实体: 母畜实体;
  价格: number;
  已售出: boolean;
}

interface 奴隶刷新配置 {
  刷新数量范围: { 最小: number; 最大: number };
  价格计算: (母畜: 母畜实体) => number;
}

interface 购买结果 {
  成功: boolean;
  原因?: string;
  消耗催淫母乳?: number;
  执行结果?: 商品执行效果结果;
}

interface 奴隶购买结果 {
  成功: boolean;
  原因?: string;
  消耗催淫母乳?: number;
  获得母畜?: 母畜实体;
}

// ─── 游戏总控接口 ───

interface 游戏总控接口 {
  地点管理: {
    获取地点: (地点ID: string) => 可袭击地点实体 | null;
  };
  母畜管理: {
    从劝诱获取母畜: (母畜: 母畜实体) => void;
    移除母畜: (母畜ID: string) => void;
  };
  冠军管理: {
    从生育获取冠军: (冠军: 冠军实体) => void;
  };
  喽啰池管理: {
    获取喽啰总数: () => number;
    获取无将领喽啰池: () => 喽啰池;
    武装升级: (数量:number, 等级:武装等级) => boolean;
  };
  资源管理: {
    获取士气: () => number;
    修改士气: (增量: number) => number;
    获取催淫母乳数量: () => number;
    修改催淫母乳数量: (增量: number) => number;
  };
  实体管理: {
    获取实体: (实体ID: string) => 实体基类 | null;
  };
  获取领主: () => 领主实体;
}

// ═══════════════════════════════════════════════════════════════
// 任务管理器
// ═══════════════════════════════════════════════════════════════

class 任务管理器 {
  private 任务注册表: Map<string, 任务配置>;
  private 已发布任务列表: Map<string, 已发布任务>;
  private 被占用执行人: Set<string>;
  private 被占用目标: Set<string>;
  private 任务计数器: number;
  private 游戏总控: 游戏总控接口 | null;

  constructor() {
    this.任务注册表 = new Map();
    this.已发布任务列表 = new Map();
    this.被占用执行人 = new Set();
    this.被占用目标 = new Set();
    this.任务计数器 = 0;
    this.游戏总控 = null;
  }

  // ─── 初始化 ───

  设置游戏总控(总控: 游戏总控接口): void {
    this.游戏总控 = 总控;
  }

  // ─── 任务注册（由 rules.ts 调用）───

  注册任务(任务名: string, 配置: 任务配置): void {
    this.任务注册表.set(任务名, 配置);
  }

  获取任务配置(任务名: string): 任务配置 | undefined {
    return this.任务注册表.get(任务名);
  }

  获取所有任务名(): string[] {
    return Array.from(this.任务注册表.keys());
  }

  // ─── 占用状态查询 ───

  
  占用实体(实体: 可执行实体): void {
    this.被占用目标.add(实体.实体ID);
  }
  释放实体(实体: 可执行实体): void {
    this.被占用目标.delete(实体.实体ID);
  }

  执行人是否被占用(执行人ID: string): boolean {
    return this.被占用执行人.has(执行人ID);
  }

  目标是否被占用(目标ID: string): boolean {
    return this.被占用目标.has(目标ID);
  }

  获取可用执行人<T extends 可执行实体>(执行人列表: T[]): T[] {
    return 执行人列表.filter(e => !this.被占用执行人.has(e.实体ID));
  }

  获取可用目标<T extends 实体基类>(目标列表: T[]): T[] {
    return 目标列表.filter(t => !this.被占用目标.has(t.实体ID));
  }

  // ─── 前置条件检查 ───

  检查前置条件(任务名: string, 执行人: 可执行实体): { 通过: boolean; 失败原因?: string } {
    const 配置 = this.任务注册表.get(任务名);
    if (!配置) {
      return { 通过: false, 失败原因: '任务不存在' };
    }

    if (this.被占用执行人.has(执行人.实体ID)) {
      return { 通过: false, 失败原因: '执行人已被占用' };
    }

    const 条件列表 = 配置.前置条件 ?? [];
    for (let i = 0; i < 条件列表.length; i++) {
      if (!条件列表[i](执行人)) {
        return { 通过: false, 失败原因: `前置条件 ${i + 1} 未满足` };
      }
    }

    return { 通过: true };
  }

  // ─── 任务发布 ───

  发布任务(
    任务名: string,
    执行人: 可执行实体,
    目标: 可目标实体 = null,
  ): { 成功: boolean; 任务ID?: string; 原因?: string } {
    // 检查任务存在
    const 配置 = this.任务注册表.get(任务名);
    if (!配置) {
      return { 成功: false, 原因: '任务不存在' };
    }

    // 检查执行人占用
    if (this.被占用执行人.has(执行人.实体ID)) {
      return { 成功: false, 原因: '执行人已被占用' };
    }

    // 检查目标占用
    if (目标 && this.被占用目标.has(目标.实体ID)) {
      return { 成功: false, 原因: '目标已被占用' };
    }

    // 前置条件
    const 条件检查 = this.检查前置条件(任务名, 执行人);
    if (!条件检查.通过) {
      return { 成功: false, 原因: 条件检查.失败原因 };
    }

    // 计算行动力占用
    const 行动力 = 配置.行动力占用 ? 配置.行动力占用(执行人) : 1;

    // 生成任务ID
    this.任务计数器++;
    const 任务ID = `task_${Date.now()}_${this.任务计数器}`;

    // 创建任务记录
    const 任务记录: 已发布任务 = {
      任务ID,
      任务名,
      执行人ID: 执行人.实体ID,
      目标ID: 目标?.实体ID ?? null,
      行动力占用: 行动力,
      发布时间: Date.now(),
    };

    // 注册任务和占用
    this.已发布任务列表.set(任务ID, 任务记录);
    this.被占用执行人.add(执行人.实体ID);
    if (目标) {
      this.被占用目标.add(目标.实体ID);
    }

    return { 成功: true, 任务ID };
  }


  // ─── 任务取消 ───

  取消任务(任务ID: string): { 成功: boolean; 原因?: string } {
    const 任务 = this.已发布任务列表.get(任务ID);
    if (!任务) {
      return { 成功: false, 原因: '任务不存在' };
    }

    // 释放占用
    this.被占用执行人.delete(任务.执行人ID);
    if (任务.目标ID) {
      this.被占用目标.delete(任务.目标ID);
    }

    // 移除任务
    this.已发布任务列表.delete(任务ID);

    return { 成功: true };
  }

  // ─── 任务修改 ───

  修改任务(任务ID: string, 新执行人?: 可执行实体, 新目标?: 可目标实体): { 成功: boolean; 原因?: string } {
    const 任务 = this.已发布任务列表.get(任务ID);
    if (!任务) {
      return { 成功: false, 原因: '任务不存在' };
    }

    const 配置 = this.任务注册表.get(任务.任务名);
    if (!配置) {
      return { 成功: false, 原因: '任务配置不存在' };
    }

    // 如果更换执行人
    if (新执行人 && 新执行人.实体ID !== 任务.执行人ID) {
      if (this.被占用执行人.has(新执行人.实体ID)) {
        return { 成功: false, 原因: '新执行人已被占用' };
      }

      // 检查前置条件
      const 条件检查 = this.检查前置条件(任务.任务名, 新执行人);
      if (!条件检查.通过) {
        return { 成功: false, 原因: 条件检查.失败原因 };
      }

      // 释放旧执行人，占用新执行人
      this.被占用执行人.delete(任务.执行人ID);
      this.被占用执行人.add(新执行人.实体ID);
      任务.执行人ID = 新执行人.实体ID;

      // 重新计算行动力
      任务.行动力占用 = 配置.行动力占用 ? 配置.行动力占用(新执行人) : 1;
    }

    // 如果更换目标
    if (新目标 !== undefined) {
      const 新目标ID = 新目标?.实体ID ?? null;
      if (新目标ID !== 任务.目标ID) {
        if (新目标 && this.被占用目标.has(新目标.实体ID)) {
          return { 成功: false, 原因: '新目标已被占用' };
        }

        // 释放旧目标
        if (任务.目标ID) {
          this.被占用目标.delete(任务.目标ID);
        }

        // 占用新目标
        if (新目标) {
          this.被占用目标.add(新目标.实体ID);
        }

        任务.目标ID = 新目标ID;
      }
    }

    return { 成功: true };
  }

  // ─── 回合结算 ───

  结算所有任务(): 任务结算结果[] {
    if (!this.游戏总控) {
      throw new Error('游戏总控未设置');
    }

    const 结果列表: 任务结算结果[] = [];

    // 按发布时间排序
    const 排序任务 = Array.from(this.已发布任务列表.values()).sort((a, b) => a.发布时间 - b.发布时间);

    for (const 任务 of 排序任务) {
      const 配置 = this.任务注册表.get(任务.任务名);
      if (!配置) continue;

      // 获取执行人实体
      const 执行人实体 = this.游戏总控.实体管理.获取实体(任务.执行人ID) as 可执行实体 | null;
      if (!执行人实体) {
        结果列表.push({
          任务ID: 任务.任务ID,
          结果: {
            成功: false,
            类型: 任务.任务名,
            执行人: null as unknown as 可执行实体,
            目标: null,
            原因: '执行人不存在',
          },
        });
        continue;
      }

      // 获取目标实体
      let 目标实体: 可目标实体 = null;
      if (任务.目标ID) {
        目标实体 = this.游戏总控.实体管理.获取实体(任务.目标ID) as 可目标实体;
      }

      // 执行任务
      const 执行结果 = 配置.执行效果(执行人实体, 目标实体, this.游戏总控);

      结果列表.push({
        任务ID: 任务.任务ID,
        结果: 执行结果,
      });
    }

    // 清空所有任务和占用
    this.已发布任务列表.clear();
    this.被占用执行人.clear();
    this.被占用目标.clear();

    return 结果列表;
  }

  // ─── 查询 ───

  获取已发布任务列表(): 已发布任务[] {
    return Array.from(this.已发布任务列表.values());
  }

  获取任务(任务ID: string): 已发布任务 | undefined {
    return this.已发布任务列表.get(任务ID);
  }

  获取执行人当前任务(执行人ID: string): 已发布任务 | undefined {
    for (const 任务 of this.已发布任务列表.values()) {
      if (任务.执行人ID === 执行人ID) return 任务;
    }
    return undefined;
  }
}

// ═══════════════════════════════════════════════════════════════
// 法术管理器
// ═══════════════════════════════════════════════════════════════

class 法术管理器 {
  private 法术注册表: Map<string, 法术配置>;
  private 本回合已使用: boolean;
  private 本回合使用记录: 法术使用记录 | null;
  private 游戏总控: 游戏总控接口 | null;

  constructor() {
    this.法术注册表 = new Map();
    this.本回合已使用 = false;
    this.本回合使用记录 = null;
    this.游戏总控 = null;
  }

  // ─── 初始化 ───

  设置游戏总控(总控: 游戏总控接口): void {
    this.游戏总控 = 总控;
  }

  // ─── 法术注册（由 rules.ts 调用）───

  注册法术(法术名: string, 配置: 法术配置): void {
    this.法术注册表.set(法术名, 配置);
  }

  获取法术配置(法术名: string): 法术配置 | undefined {
    return this.法术注册表.get(法术名);
  }

  获取所有法术名(): string[] {
    return Array.from(this.法术注册表.keys());
  }

  // ─── 使用限制查询 ───

  本回合可使用法术(): boolean {
    return !this.本回合已使用;
  }

  获取本回合使用记录(): 法术使用记录 | null {
    return this.本回合使用记录;
  }

  // ─── 法术使用 ───

  使用法术(
    法术名: string,
    倍率: number,
    目标: 可目标实体 | 母畜实体 = null,
  ): { 成功: boolean; 原因?: string; 结果?: 法术执行效果结果 } {
    if (!this.游戏总控) {
      return { 成功: false, 原因: '游戏总控未设置' };
    }

    if (this.本回合已使用) {
      return { 成功: false, 原因: '本回合已使用过法术' };
    }

    const 配置 = this.法术注册表.get(法术名);
    if (!配置) {
      return { 成功: false, 原因: '法术不存在' };
    }

    // 限制倍率
    const 实际倍率 = Math.min(Math.max(1, Math.floor(倍率)), 配置.法术倍率上限);
    const 消耗 = 配置.价格 * 实际倍率;

    // 检查魔力
    const 领主 = this.游戏总控.获取领主();
    const 当前魔力 = 领主.获取属性('魔力');
    if (当前魔力 < 消耗) {
      return { 成功: false, 原因: `魔力不足，需要 ${消耗}，当前 ${当前魔力}` };
    }

    // 消耗魔力
    const 消耗结果 = 领主.消耗魔力(消耗);
    if (!消耗结果.成功) {
      return { 成功: false, 原因: 消耗结果.原因 };
    }

    // 执行法术
    const 执行结果 = 配置.执行效果(实际倍率, 目标, this.游戏总控);

    // 记录使用
    this.本回合已使用 = true;
    this.本回合使用记录 = {
      法术名,
      倍率: 实际倍率,
      消耗魔力: 消耗,
      目标ID: 目标?.实体ID ?? null,
    };

    return { 成功: true, 结果: 执行结果 };
  }

  // ─── 回合重置 ───

  回合重置(): void {
    this.本回合已使用 = false;
    this.本回合使用记录 = null;
  }

  // ─── 预计算 ───

  计算法术消耗(法术名: string, 倍率: number): number | null {
    const 配置 = this.法术注册表.get(法术名);
    if (!配置) return null;

    const 实际倍率 = Math.min(Math.max(1, Math.floor(倍率)), 配置.法术倍率上限);
    return 配置.价格 * 实际倍率;
  }
}

// ═══════════════════════════════════════════════════════════════
// 黑市管理器
// ═══════════════════════════════════════════════════════════════

class 黑市管理器 {
  private 商品注册表: Map<string, 商品配置>;
  private 商品实例表: Map<string, 商品实例>;
  private 奴隶货架: Map<string, 奴隶商品>;
  private 奴隶刷新配置: 奴隶刷新配置 | null;
  private 游戏总控: 游戏总控接口 | null;
  private 工厂管理器: 工厂管理器 | null;
  private 商品计数器: number;

  constructor() {
    this.商品注册表 = new Map();
    this.商品实例表 = new Map();
    this.奴隶货架 = new Map();
    this.奴隶刷新配置 = null;
    this.游戏总控 = null;
    this.工厂管理器 = null;
    this.商品计数器 = 0;
  }

  // ─── 初始化 ───

  设置游戏总控(总控: 游戏总控接口): void {
    this.游戏总控 = 总控;
  }

  设置工厂管理器(工厂: 工厂管理器): void {
    this.工厂管理器 = 工厂;
  }

  设置奴隶刷新配置(配置: 奴隶刷新配置): void {
    this.奴隶刷新配置 = 配置;
  }

  // ─── 商品注册（由 rules.ts 调用）───

  注册商品(商品名: string, 配置: 商品配置): void {
    this.商品注册表.set(商品名, 配置);

    // 创建商品实例
    this.商品计数器++;
    const 商品ID = `goods_${商品名}_${this.商品计数器}`;
    this.商品实例表.set(商品名, {
      商品ID,
      配置,
      本周已购买: 0,
    });
  }

  获取商品配置(商品名: string): 商品配置 | undefined {
    return this.商品注册表.get(商品名);
  }

  获取所有商品名(): string[] {
    return Array.from(this.商品注册表.keys());
  }

  // ─── 常驻商品购买 ───

  购买商品(商品名: string, 购买数量: number, 目标: 可目标实体 | 母畜实体 | null = null): 购买结果 {
    if (!this.游戏总控) {
      return { 成功: false, 原因: '游戏总控未设置' };
    }

    const 实例 = this.商品实例表.get(商品名);
    if (!实例) {
      return { 成功: false, 原因: '商品不存在' };
    }

    const 配置 = 实例.配置;

    // 检查限购
    if (实例.本周已购买 + 购买数量 > 配置.每周限购) {
      const 剩余 = 配置.每周限购 - 实例.本周已购买;
      return { 成功: false, 原因: `超出本周限购，剩余可购买 ${剩余}` };
    }

    // 计算总价
    const 总价 = 配置.价格 * 购买数量;
    const 当前母乳数量 = this.游戏总控.资源管理.获取催淫母乳数量();
    if (当前母乳数量 < 总价) {
      return { 成功: false, 原因: `母乳数量不足，需要 ${总价}，当前 ${当前母乳数量}` };
    }

    // 扣除催淫母乳
    this.游戏总控.资源管理.修改催淫母乳数量(-总价);

    // 执行效果
    const 执行结果 = 配置.执行效果(购买数量, 目标, this.游戏总控);

    // 更新已购买数量
    实例.本周已购买 += 购买数量;

    return {
      成功: true,
      消耗催淫母乳: 总价,
      执行结果,
    };
  }

  // ─── 奴隶货架管理 ───

  刷新奴隶货架(): void {
    if (!this.奴隶刷新配置 || !this.工厂管理器) {
      return;
    }

    // 清空旧货架
    this.奴隶货架.clear();

    // 随机数量
    const { 最小, 最大 } = this.奴隶刷新配置.刷新数量范围;
    const 数量 = Math.floor(Math.random() * (最大 - 最小 + 1)) + 最小;

    // 生成新奴隶
    for (let i = 0; i < 数量; i++) {
      const 母畜 = this.工厂管理器.创建潜在母畜({
        来源: '黑市',
      });

      const 价格 = this.奴隶刷新配置.价格计算(母畜);
      const 商品ID = `slave_${Date.now()}_${i}`;

      this.奴隶货架.set(商品ID, {
        商品ID,
        母畜实体: 母畜,
        价格,
        已售出: false,
      });
    }
  }

  获取奴隶货架(): 奴隶商品[] {
    return Array.from(this.奴隶货架.values()).filter(s => !s.已售出);
  }

  购买奴隶(商品ID: string): 奴隶购买结果 {
    if (!this.游戏总控) {
      return { 成功: false, 原因: '游戏总控未设置' };
    }

    const 奴隶 = this.奴隶货架.get(商品ID);
    if (!奴隶) {
      return { 成功: false, 原因: '奴隶商品不存在' };
    }

    if (奴隶.已售出) {
      return { 成功: false, 原因: '该奴隶已售出' };
    }

    // 检查催淫母乳
    const 当前催淫母乳 = this.游戏总控.资源管理.获取催淫母乳数量();
    if (当前催淫母乳 < 奴隶.价格) {
      return { 成功: false, 原因: `催淫母乳不足，需要 ${奴隶.价格}，当前 ${当前催淫母乳}` };
    }

    // 扣除催淫母乳
    this.游戏总控.资源管理.修改催淫母乳数量(-奴隶.价格);

    // 标记售出
    奴隶.已售出 = true;

    // 加入玩家母畜列表
    this.游戏总控.母畜管理.从劝诱获取母畜(奴隶.母畜实体);

    return {
      成功: true,
      消耗催淫母乳: 奴隶.价格,
      获得母畜: 奴隶.母畜实体,
    };
  }

  // ─── 回合重置 ───

  回合重置(): void {
    // 重置所有商品的本周购买数
    for (const 实例 of this.商品实例表.values()) {
      实例.本周已购买 = 0;
    }

    // 刷新奴隶货架
    this.刷新奴隶货架();
  }

  // ─── 查询 ───

  获取商品可购买数量(商品名: string): number | null {
    const 实例 = this.商品实例表.get(商品名);
    if (!实例) return null;
    return 实例.配置.每周限购 - 实例.本周已购买;
  }

  获取商品已购买数量(商品名: string): number | null {
    const 实例 = this.商品实例表.get(商品名);
    if (!实例) return null;
    return 实例.本周已购买;
  }
}

// ═══════════════════════════════════════════════════════════════
// 回合管理器
// ═══════════════════════════════════════════════════════════════

interface 回合结算摘要 {
  回合数: number;
  任务结算结果: 任务结算结果[];
  法术使用记录: 法术使用记录 | null;
}

class 回合管理器 {
  private 当前回合: number;
  private 任务管理器: 任务管理器;
  private 法术管理器: 法术管理器;
  private 黑市管理器: 黑市管理器;

  constructor(任务管理: 任务管理器, 法术管理: 法术管理器, 黑市管理: 黑市管理器) {
    this.当前回合 = 0;
    this.任务管理器 = 任务管理;
    this.法术管理器 = 法术管理;
    this.黑市管理器 = 黑市管理;
  }

  获取当前回合(): number {
    return this.当前回合;
  }

  结束回合(): 回合结算摘要 {
    // 获取法术记录
    const 法术记录 = this.法术管理器.获取本回合使用记录();

    // 结算任务
    const 任务结果 = this.任务管理器.结算所有任务();

    this.当前回合++;

    // 重置各系统
    this.法术管理器.回合重置();
    this.黑市管理器.回合重置();

    return {
      回合数: this.当前回合,
      任务结算结果: 任务结果,
      法术使用记录: 法术记录,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// 系统管理器（整合入口）
// ═══════════════════════════════════════════════════════════════

class 系统管理器 {
  readonly 任务管理器: 任务管理器;
  readonly 法术管理器: 法术管理器;
  readonly 黑市管理器: 黑市管理器;
  readonly 回合管理器: 回合管理器;

  constructor() {
    this.任务管理器 = new 任务管理器();
    this.法术管理器 = new 法术管理器();
    this.黑市管理器 = new 黑市管理器();
    this.回合管理器 = new 回合管理器(this.任务管理器, this.法术管理器, this.黑市管理器);
  }

  初始化(游戏总控: 游戏总控接口, 工厂管理器: 工厂管理器): void {
    this.任务管理器.设置游戏总控(游戏总控);
    this.法术管理器.设置游戏总控(游戏总控);
    this.黑市管理器.设置游戏总控(游戏总控);
    this.黑市管理器.设置工厂管理器(工厂管理器);
  }

  设置奴隶刷新配置(配置: 奴隶刷新配置): void {
    this.黑市管理器.设置奴隶刷新配置(配置);
  }
}

// ═══════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════

export { 任务管理器, 法术管理器, 黑市管理器, 回合管理器, 系统管理器 };

export type {
  任务配置,
  任务前置条件,
  任务执行效果结果,
  已发布任务,
  任务结算结果,
  法术配置,
  法术执行效果结果,
  法术使用记录,
  商品配置,
  商品执行效果结果,
  商品实例,
  奴隶商品,
  奴隶刷新配置,
  购买结果,
  奴隶购买结果,
  回合结算摘要,
  游戏总控接口,
  可执行实体,
  可目标实体,
};
