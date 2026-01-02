// ═══════════════════════════════════════════════════════════════
// core/managers.ts
// 游戏系统管理器 - 任务、法术、黑市调度层
// ═══════════════════════════════════════════════════════════════

import { 冠军实体, 母畜实体, 可袭击地点实体, 领主实体, 喽啰池实体, 实体基类 } from './entities';

import { 工厂管理器 } from './factories';


import type { 实体类型,可执行实体, 可目标实体, 武装等级, 任务前置条件, 任务执行结果, 战斗结果, 回合结算摘要, 
  任务配置, 已发布任务, 任务结算结果, 
  法术执行结果, 法术配置, 法术使用记录, 商品执行效果结果, 商品配置, 商品实例, 奴隶商品, 奴隶刷新配置, 购买结果, 奴隶购买结果, 游戏总控接口
} from '../types/index';

import type {分配请求, 分配结果, 战斗部署, 
  战斗配置, 快速填充结果, 喽啰池管理接口, 
  战斗系统依赖, 资源状态, 实体统计} from '../types/';


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

  
  占用实体(实体: 实体类型): void {
    this.被占用目标.add(实体.实体ID);
  }
  释放实体(实体: 实体类型): void {
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
      if (!条件列表[i]!(执行人)) {
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
  ): { 成功: boolean; 原因?: string; 结果?: 法术执行结果 } {
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
// 资源管理器
// ═══════════════════════════════════════════════════════════════

class 资源管理器 {
  private 士气: number;
  private 最大士气: number;
  private 催淫母乳: number;

  constructor(初始配置: Partial<资源状态> = {}) {
      this.士气 = 初始配置.士气 ?? 50;
      this.最大士气 = 初始配置.最大士气 ?? 100;
      this.催淫母乳 = 初始配置.催淫母乳 ?? 0;
  }

  // ─── 士气操作 ───

  获取士气(): number {
      return this.士气;
  }

  获取最大士气(): number {
      return this.最大士气;
  }

  修改士气(增量: number): number {
      this.士气 = Math.max(0, Math.min(this.最大士气, this.士气 + 增量));
      return this.士气;
  }

  设置士气(值: number): void {
      this.士气 = Math.max(0, Math.min(this.最大士气, 值));
  }

  设置最大士气(值: number): void {
      this.最大士气 = Math.max(0, 值);
      if (this.士气 > this.最大士气) {
          this.士气 = this.最大士气;
      }
  }

  获取士气百分比(): number {
      return this.最大士气 > 0 ? (this.士气 / this.最大士气) * 100 : 0;
  }

  // ─── 催淫母乳操作 ───

  获取催淫母乳数量(): number {
      return this.催淫母乳;
  }

  修改催淫母乳数量(增量: number): number {
      this.催淫母乳 = Math.max(0, this.催淫母乳 + 增量);
      return this.催淫母乳;
  }

  设置催淫母乳数量(值: number): void {
      this.催淫母乳 = Math.max(0, 值);
  }

  // ─── 状态查询 ───

  获取资源状态(): 资源状态 {
      return {
          士气: this.士气,
          最大士气: this.最大士气,
          催淫母乳: this.催淫母乳,
      };
  }

  // ─── 回合结算 ───

  回合结算(): void {
      const 衰减上限 = 10;
      const 理论衰减 = Math.floor(this.士气 / 8)
      const 衰减 = Math.min(理论衰减, 衰减上限);
      this.修改士气(-衰减);
  }
}

// ═══════════════════════════════════════════════════════════════
// 实体管理器
// ═══════════════════════════════════════════════════════════════

class 实体管理器 {
  private 领主实例: 领主实体 | null;
  private 冠军表: Map<string, 冠军实体>;
  private 母畜表: Map<string, 母畜实体>;
  private 地点表: Map<string, 可袭击地点实体>;
  private 喽啰池表: Map<string, 喽啰池实体>;
  private 无将领喽啰池: 喽啰池实体;

  constructor() {
      this.领主实例 = null;
      this.冠军表 = new Map();
      this.母畜表 = new Map();
      this.地点表 = new Map();
      this.喽啰池表 = new Map();
      this.无将领喽啰池 = new 喽啰池实体();
  }



  // ─── 领主管理 ───

  设置领主(领主: 领主实体): void {
      this.领主实例 = 领主;
  }

  获取领主(): 领主实体 | null {
      return this.领主实例;
  }

  // ─── 冠军管理 ───

  添加冠军(冠军: 冠军实体): void {
      this.冠军表.set(冠军.实体ID, 冠军);

      // 注册冠军的喽啰池
      const 喽啰池实例 = 冠军.获取喽啰池();
      if (喽啰池实例) {
          this.喽啰池表.set(喽啰池实例.实体ID, 喽啰池实例);
      }
  }

  移除冠军(冠军ID: string): boolean {
      const 冠军 = this.冠军表.get(冠军ID);
      if (!冠军) return false;

      // 移除关联的喽啰池
      const 喽啰池实例 = 冠军.获取喽啰池();
      if (喽啰池实例) {
          this.喽啰池表.delete(喽啰池实例.实体ID);
      }

      this.冠军表.delete(冠军ID);
      return true;
  }

  获取冠军(冠军ID: string): 冠军实体 | null {
      return this.冠军表.get(冠军ID) ?? null;
  }

  获取所有冠军(): 冠军实体[] {
      return Array.from(this.冠军表.values());
  }

  // ─── 母畜管理 ───

  添加母畜(母畜: 母畜实体): void {
      this.母畜表.set(母畜.实体ID, 母畜);
  }

  移除母畜(母畜: 母畜实体): boolean {
      return this.母畜表.delete(母畜.实体ID);
  }

  获取母畜(母畜ID: string): 母畜实体 | null {
      return this.母畜表.get(母畜ID) ?? null;
  }

  获取所有母畜(): 母畜实体[] {
      return Array.from(this.母畜表.values());
  }

  // ─── 地点管理 ───

  添加地点(地点: 可袭击地点实体): void {
      this.地点表.set(地点.实体ID, 地点);
  }

  移除地点(地点ID: string): boolean {
      return this.地点表.delete(地点ID);
  }

  获取地点(地点ID: string): 可袭击地点实体 | null {
      return this.地点表.get(地点ID) ?? null;
  }

  获取所有地点(): 可袭击地点实体[] {
      return Array.from(this.地点表.values());
  }

  // ─── 喽啰池管理 ───

  获取无将领喽啰池(): 喽啰池实体 {
      return this.无将领喽啰池;
  }

  获取所有将领喽啰池(): Map<string, 喽啰池实体> {
      const 将领池表 = new Map<string, 喽啰池实体>();
      for (const [id, 池] of this.喽啰池表) {
          if (池.获取将领() !== null) {
              将领池表.set(id, 池);
          }
      }
      return 将领池表;
  }

  获取喽啰总数(): number {
      let 总数 = this.无将领喽啰池.获取总数量();
      for (const 池 of this.喽啰池表.values()) {
          总数 += 池.获取总数量();
      }
      return 总数;
  }

  // ─── 通用实体查询 ───

  获取实体(实体ID: string): 实体类型 | null {
      // 检查领主
      if (this.领主实例?.实体ID === 实体ID) {
          return this.领主实例;
      }

      // 检查冠军
      if (this.冠军表.has(实体ID)) {
          return this.冠军表.get(实体ID)!;
      }

      // 检查母畜
      if (this.母畜表.has(实体ID)) {
          return this.母畜表.get(实体ID)!;
      }

      // 检查地点
      if (this.地点表.has(实体ID)) {
          return this.地点表.get(实体ID)!;
      }

      // 检查喽啰池
      if (this.喽啰池表.has(实体ID)) {
          return this.喽啰池表.get(实体ID)!;
      }

      if (this.无将领喽啰池.实体ID === 实体ID) {
          return this.无将领喽啰池;
      }

      return null;
  }

  // ─── 统计 ───

  获取实体统计(): 实体统计 {
      return {
          领主数量: this.领主实例 ? 1 : 0,
          冠军数量: this.冠军表.size,
          母畜数量: this.母畜表.size,
          地点数量: this.地点表.size,
          喽啰总数: this.获取喽啰总数(),
      };
  }
}

// ═══════════════════════════════════════════════════════════════
// 喽啰调配器
// ═══════════════════════════════════════════════════════════════

class 喽啰管理器 {
  private 喽啰池管理: 喽啰池管理接口;
  private 武装优先级: 武装等级[];

  constructor(喽啰池管理: 喽啰池管理接口) {
      this.喽啰池管理 = 喽啰池管理;
      // 按战斗力从高到低排序
      this.武装优先级 = ['精英武装', '高级武装', '中级武装', '低级武装', '未武装'];
  }

  // ─── 获取喽啰池状态 ───

  获取无将领喽啰池(): 喽啰池实体 {
      return this.喽啰池管理.获取无将领喽啰池();
  }

  获取将领喽啰池(将领: 冠军实体): 喽啰池实体 | null {
      return 将领.获取喽啰池();
  }

  // ─── 基础分配操作 ───


  /**
   * 从无将领池向将领池分配喽啰
   */
  分配到将领(将领: 冠军实体, 请求列表: 分配请求[]): 分配结果 {
      const 目标池 = 将领.获取喽啰池();
      if (!目标池) {
          return { 成功: false, 原因: '将领未绑定喽啰池', 实际分配: 0, 分配详情: [] };
      }

      const 无将领池 = this.获取无将领喽啰池();
      const 可用容量 = 目标池.获取最大数量() - 目标池.获取总数量();

      if (可用容量 <= 0) {
          return { 成功: false, 原因: '将领喽啰池已满', 实际分配: 0, 分配详情: [] };
      }

      let 总分配 = 0;
      const 分配详情: Array<{ 等级: string; 数量: number }> = [];

      for (const 请求 of 请求列表) {
          const 剩余容量 = 可用容量 - 总分配;
          if (剩余容量 <= 0) break;

          const 实际需求 = Math.min(请求.数量, 剩余容量);
          const 来源数量 = 无将领池.获取分组数量(请求.武装等级);
          const 实际分配数量 = Math.min(实际需求, 来源数量);

          if (实际分配数量 > 0) {
              无将领池.减少喽啰(实际分配数量, 请求.武装等级);
              目标池.增加喽啰(实际分配数量, 请求.武装等级);
              总分配 += 实际分配数量;
              分配详情.push({ 等级: 请求.武装等级, 数量: 实际分配数量 });
          }
      }

      return {
          成功: 总分配 > 0,
          实际分配: 总分配,
          分配详情,
      };
  }

  /**
   * 从将领池向无将领池归还喽啰
   */
  归还到公共池(将领: 冠军实体, 请求列表: 分配请求[]): 分配结果 {
      const 来源池 = 将领.获取喽啰池();
      if (!来源池) {
          return { 成功: false, 原因: '将领未绑定喽啰池', 实际分配: 0, 分配详情: [] };
      }

      const 无将领池 = this.获取无将领喽啰池();
      let 总归还 = 0;
      const 分配详情: Array<{ 等级: string; 数量: number }> = [];

      for (const 请求 of 请求列表) {
          const 来源数量 = 来源池.获取分组数量(请求.武装等级);
          const 实际归还数量 = Math.min(请求.数量, 来源数量);

          if (实际归还数量 > 0) {
              来源池.减少喽啰(实际归还数量, 请求.武装等级);
              无将领池.增加喽啰(实际归还数量, 请求.武装等级);
              总归还 += 实际归还数量;
              分配详情.push({ 等级: 请求.武装等级, 数量: 实际归还数量 });
          }
      }

      return {
          成功: 总归还 > 0,
          实际分配: 总归还,
          分配详情,
      };
  }

  /**
   * 清空将领喽啰池，全部归还公共池
   */
  清空将领喽啰池(将领: 冠军实体): 分配结果 {
      const 来源池 = 将领.获取喽啰池();
      if (!来源池) {
          return { 成功: false, 原因: '将领未绑定喽啰池', 实际分配: 0, 分配详情: [] };
      }

      const 分组详情 = 来源池.获取分组详情();
      const 请求列表: 分配请求[] = 分组详情
          .filter(分组 => 分组.数量 > 0)
          .map(分组 => ({ 武装等级: 分组.等级, 数量: 分组.数量 }));

      return this.归还到公共池(将领, 请求列表);
  }

  // ─── 快速填充（最大化战斗力）───

  /**
   * 快速填充将领喽啰池至上限，优先选择高战斗力武装
   */
  快速填充到上限(将领: 冠军实体): 快速填充结果 {
      const 目标池 = 将领.获取喽啰池();
      if (!目标池) {
          return { 成功: false, 原因: '将领未绑定喽啰池', 填充数量: 0, 当前战斗力: 0, 填充详情: [] };
      }

      const 无将领池 = this.获取无将领喽啰池();
      const 最大容量 = 目标池.获取最大数量();
      const 当前数量 = 目标池.获取总数量();
      let 剩余容量 = 最大容量 - 当前数量;

      if (剩余容量 <= 0) {
          return {
              成功: true,
              原因: '喽啰池已满',
              填充数量: 0,
              当前战斗力: 目标池.获取战斗力(),
              填充详情: [],
          };
      }

      const 填充详情: Array<{ 等级: string; 数量: number }> = [];
      let 总填充 = 0;

      // 按战斗力优先级填充
      for (const 武装等级 of this.武装优先级) {
          if (剩余容量 <= 0) break;

          const 可用数量 = 无将领池.获取分组数量(武装等级);
          const 填充数量 = Math.min(可用数量, 剩余容量);

          if (填充数量 > 0) {
              无将领池.减少喽啰(填充数量, 武装等级);
              目标池.增加喽啰(填充数量, 武装等级);
              剩余容量 -= 填充数量;
              总填充 += 填充数量;
              填充详情.push({ 等级: 武装等级, 数量: 填充数量 });
          }
      }

      return {
          成功: true,
          填充数量: 总填充,
          当前战斗力: 目标池.获取战斗力(),
          填充详情,
      };
  }

  /**
   * 优化将领喽啰池配置（替换低级武装为高级武装）
   */
  优化战斗力配置(将领: 冠军实体): 快速填充结果 {
      // 先清空再重新填充，确保最优配置
      this.清空将领喽啰池(将领);
      return this.快速填充到上限(将领);
  }

  // ─── 查询方法 ───

  获取分配预览(将领: 冠军实体): {
      当前数量: number;
      最大数量: number;
      当前战斗力: number;
      分组详情: Array<{ 等级: string; 数量: number; 战斗力: number }>;
  } | null {
      const 目标池 = 将领.获取喽啰池();
      if (!目标池) return null;

      return {
          当前数量: 目标池.获取总数量(),
          最大数量: 目标池.获取最大数量(),
          当前战斗力: 目标池.获取战斗力(),
          分组详情: 目标池.获取分组详情().map(分组 => ({
              等级: 分组.等级,
              数量: 分组.数量,
              战斗力: 分组.战斗力,
          })),
      };
  }

  获取公共池状态(): {
      总数量: number;
      分组详情: Array<{ 等级: string; 数量: number; 战斗力: number }>;
  } {
      const 无将领池 = this.获取无将领喽啰池();
      return {
          总数量: 无将领池.获取总数量(),
          分组详情: 无将领池.获取分组详情().map(分组 => ({
              等级: 分组.等级,
              数量: 分组.数量,
              战斗力: 分组.战斗力,
          })),
      };
  }
}

// ═══════════════════════════════════════════════════════════════
// 战斗管理器
// ═══════════════════════════════════════════════════════════════

class 战斗管理器 {
  private 依赖: 战斗系统依赖;
  private 喽啰调配器实例: 喽啰管理器;
  private 当前部署: Map<string, 战斗部署>;
  private 选定目标: 可袭击地点实体 | null;
  private 突袭模式: boolean;
  是否战斗: boolean;

  // 常量配置
  private static readonly 普通出战行动力 = 3;
  private static readonly 突袭出战行动力 = 2;
  private static readonly 突袭战力系数 = 0.8;

  constructor(依赖: 战斗系统依赖) {
      this.依赖 = 依赖;
      this.喽啰调配器实例 = new 喽啰管理器(依赖.喽啰池管理);
      this.当前部署 = new Map();
      this.选定目标 = null;
      this.突袭模式 = false;
      this.是否战斗 = false;
  }

  // ─── 喽啰调配器访问 ───

  获取喽啰调配器(): 喽啰管理器 {
      return this.喽啰调配器实例;
  }

  // ─── 目标选择 ───

  选择目标(地点输入: 可袭击地点实体 | string): { 成功: boolean; 原因?: string } {
      let 地点: 可袭击地点实体 | null = null;
      if (typeof 地点输入 === 'string') { 
          地点 = this.依赖.获取地点(地点输入);
      } else { 
          地点 = 地点输入;
      }

      if (!地点) {
          return { 成功: false, 原因: '地点不存在' };
      }

      this.选定目标 = 地点;
      return { 成功: true };
  }

  取消目标选择(): void {
      this.选定目标 = null;
  }

  获取选定目标(): 可袭击地点实体 | null {
      return this.选定目标;
  }

  // ─── 突袭模式 ───

  设置突袭模式(启用: boolean): void {
      this.突袭模式 = 启用;
  }

  获取突袭模式(): boolean {
      return this.突袭模式;
  }

  // ─── 将领部署 ───

  /**
   * 添加将领到出战列表
   */
  添加出战将领(将领输入: 冠军实体 | string): { 成功: boolean; 原因?: string } {
      let 将领: 冠军实体 | null;
      try {
          将领 = typeof 将领输入 == 'string' ? this.依赖.获取将领(将领输入) : 将领输入;
      } catch (error) {
          return { 成功: false, 原因: '获取将领时发生错误' };
      }

      if (!将领) {
          return { 成功: false, 原因: '将领不存在' };
      }


      // 检查是否已部署
      if (this.当前部署.has(将领.实体ID)) {
          return { 成功: false, 原因: '将领已在出战列表中' };
      }

      // 检查任务系统占用
      if (this.依赖.任务管理器.执行人是否被占用(将领.实体ID)) {
          return { 成功: false, 原因: '将领在任务系统中被占用' };
      }

      // 检查是否有喽啰池
      const 喽啰池 = 将领.获取喽啰池();
      if (!喽啰池) {
          return { 成功: false, 原因: '将领未绑定喽啰池' };
      }

      this.依赖.任务管理器.占用实体(将领);

      // 计算战斗力
      const 基础战斗力 = 喽啰池.获取战斗力();
      const 实际战斗力 = this.突袭模式 ? 基础战斗力 * 战斗管理器.突袭战力系数 : 基础战斗力;

      this.当前部署.set(将领.实体ID, {
          将领ID: 将领.实体ID,
          将领,
          喽啰池,
          战斗力: 实际战斗力,
      });

      return { 成功: true };
  }

  /**
   * 从出战列表移除将领
   */
  移除出战将领(将领输入: 冠军实体 | string): { 成功: boolean; 原因?: string } {
      let 将领: 冠军实体 | null;
      try {
          将领 = typeof 将领输入 == 'string' ? this.依赖.获取将领(将领输入) : 将领输入;
      } catch (error) {
          return { 成功: false, 原因: '获取将领时发生错误' };
      }
      if (!将领) {
          return { 成功: false, 原因: '将领不存在' };
      }
      const 将领ID = 将领.实体ID;
      if (!this.当前部署.has(将领ID)) {
          return { 成功: false, 原因: '将领不在出战列表中' };
      }

      this.当前部署.delete(将领ID);
      if (将领) {
          this.依赖.任务管理器.释放实体(将领);
      }
      return { 成功: true };
  }

  /**
   * 清空出战列表
   */
  清空出战列表(): void {
      this.当前部署.forEach(战斗部署 => {
          this.移除出战将领(战斗部署.将领ID);
      });
  }

  // ─── 查询方法 ───

  获取当前部署列表(): 战斗部署[] {
      return Array.from(this.当前部署.values());
  }

  获取可出战将领(所有将领: 冠军实体[]): 冠军实体[] {
      return 所有将领.filter(将领 => {
          // 未被任务占用
          if (this.依赖.任务管理器.执行人是否被占用(将领.实体ID)) return false;
          // 未在当前部署中
          if (this.当前部署.has(将领.实体ID)) return false;
          // 有喽啰池
          if (!将领.获取喽啰池()) return false;
          return true;
      });
  }

  计算总战斗力(): number {
      let 总战力 = 0;
      for (const 部署 of this.当前部署.values()) {
          总战力 += 部署.战斗力;
      }
      return 总战力;
  }

  计算行动力消耗(): number {
      if (this.当前部署.size === 0) return 0;
      return this.突袭模式 ? 战斗管理器.突袭出战行动力 : 战斗管理器.普通出战行动力;
  }

  计算胜率(我方战斗力: number, 敌方战斗力: number, 目标: 可袭击地点实体){
      const 战力比 = 我方战斗力 / (敌方战斗力 + 1);
      const 侦察修正 = Math.min(Math.log(Math.E - 1 + 目标.获取侦察进度()/目标.获取侦查最大值()), 1);
      const 基础胜率 = 0.5 + Math.log(战力比);
      const 胜率 = Math.min(1, Math.max(0, 基础胜率 * 侦察修正));
      return 胜率;
  }

  // ─── 战斗预览 ───

  获取战斗预览(): {
      可执行: boolean;
      原因?: string;
      目标?: {
          名称: string;
          战斗力: number;
      };
      我方?: {
          总战斗力: number;
          将领数量: number;
          行动力消耗: number;
          突袭模式: boolean;
      };
      胜率预估?: number;
  } {
      if (!this.选定目标) {
          return { 可执行: false, 原因: '未选择目标地点' };
      }

      if (this.当前部署.size === 0) {
          return { 可执行: false, 原因: '未部署任何将领' };
      }

      const 敌方战斗力估值 = this.选定目标.获取战斗力估值();
      if (敌方战斗力估值 === null) {
          return { 可执行: false, 原因: '目标地点未侦查' };
      }
      const 我方战斗力 = this.计算总战斗力();

      // 简单胜率计算
      const 胜率 = this.计算胜率(我方战斗力, 敌方战斗力估值, this.选定目标);

      return {
          可执行: true,
          目标: {
              名称: this.选定目标.地点名称,
              战斗力: 敌方战斗力估值,
          },
          我方: {
              总战斗力: 我方战斗力,
              将领数量: this.当前部署.size,
              行动力消耗: this.计算行动力消耗(),
              突袭模式: this.突袭模式,
          },
          胜率预估: 胜率,
      };
  }

  // ─── 执行战斗 ───

  确认战斗(): {
      成功: boolean;
      原因?: string;
  }{
      const 战斗预览 = this.获取战斗预览()
      if (!战斗预览.可执行) {
          return {
              成功: false,
              原因: 战斗预览.原因,
          };
      } else { 
          this.是否战斗 = true;
          return {
              成功: true,
              原因: 战斗预览.原因,
          };;
      }
  }

  取消确认(): void {
      this.是否战斗 = false;
  }

  执行战斗(): 战斗结果 {
      // 预检
      const 预览 = this.获取战斗预览();
      if (!预览.可执行) {
          return {
              成功: false,
              胜利: false,
              原因: 预览.原因,
              我方战斗力: 0,
              敌方战斗力: 0,
          };
      }

      const 目标 = this.选定目标!;
      const 敌方战斗力 = 目标.获取属性('战斗力') as number;
      const 我方战斗力 = this.计算总战斗力();

      // 战斗判定
      const 战力比 = 我方战斗力 / (敌方战斗力 + 1);
      const 胜率 = this.计算胜率(我方战斗力, 敌方战斗力, 目标); // 计算胜率

      const 胜利 = Math.random() < 胜率;

      // 战损计算
      let 战损比例 = 0;
      if (胜利) {
          战损比例 = Math.max(0, Math.min(0.6, (2 - 战力比) * 0.4));
      } else {
          战损比例 = Math.min(0.8, (1 / 战力比) * 0.4);
      }

      // 应用战损到各喽啰池
      for (const 部署 of this.当前部署.values()) {
          const 池 = 部署.喽啰池;
          const 分组列表 = 池.获取分组详情();

          for (const 分组 of 分组列表) {
              const 损失 = Math.floor(分组.数量 * 战损比例);
              if (损失 > 0) {
                  池.减少喽啰(损失, 分组.等级);
              }
          }
      }

      // 胜利奖励
      const 俘获母畜: string[] = [];
      if (胜利) {
          // 获取已侦察的母畜
          const 已侦察母畜 = 目标.获取所有已侦察母畜();
          for (const 母畜 of 已侦察母畜) {
              俘获母畜.push(母畜.实体ID);
              目标.移除已捕获母畜(母畜);
          }
      }

      // 清理状态
      this.清空出战列表();

      return {
          成功: true,
          胜利,
          我方战斗力,
          敌方战斗力,
          战损比例,
          俘获母畜: 胜利 ? 俘获母畜 : undefined,
      };
  }

  // ─── 重置 ───

  回合重置(): void {
      this.清空出战列表();
      this.选定目标 = null;
      this.突袭模式 = false;
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
      const 母畜 = this.工厂管理器.创建母畜({
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



class 回合管理器 {
  private 当前回合: number;
  private 任务管理器: 任务管理器 | null;
  private 法术管理器: 法术管理器 | null;
  private 黑市管理器: 黑市管理器 | null;
  private 战斗管理器: 战斗管理器 | null;
  private 资源管理器: 资源管理器 | null;
  private 已经初始化: boolean;

  constructor() {
    this.当前回合 = 0;
    this.任务管理器 = null;
    this.法术管理器 = null;
    this.黑市管理器 = null;
    this.战斗管理器 = null;
    this.资源管理器 = null;
    this.已经初始化 = false;
  }

  初始化(任务管理: 任务管理器, 法术管理: 法术管理器, 黑市管理: 黑市管理器, 战斗管理: 战斗管理器,资源管理:资源管理器):void {
    this.当前回合 = 0;
    this.任务管理器 = 任务管理;
    this.法术管理器 = 法术管理;
    this.黑市管理器 = 黑市管理;
    this.战斗管理器 = 战斗管理;
    this.资源管理器 = 资源管理;
    this.已经初始化 = true;
  }

  获取当前回合(): number {
    return this.当前回合;
  }

  结束回合(): 回合结算摘要 {
    if (!this.法术管理器 || !this.任务管理器 || !this.黑市管理器 || !this.战斗管理器 || !this.资源管理器) {
      throw new Error('未初始化');
    }
    // 获取法术记录
    const 法术记录 = this.法术管理器.获取本回合使用记录();

    // 结算任务
    const 任务结果 = this.任务管理器.结算所有任务();

    let 战斗结果 = null;

    if(this.战斗管理器.是否战斗){
      战斗结果 = this.战斗管理器.执行战斗();
    }

    this.当前回合++;

    // 重置各系统
    this.法术管理器.回合重置();
    this.黑市管理器.回合重置();
    this.战斗管理器.回合重置();

    return {
      回合数: this.当前回合,
      任务结算结果: 任务结果,
      法术使用记录: 法术记录,
      战斗结果记录: 战斗结果,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════

export { 任务管理器, 法术管理器, 黑市管理器, 回合管理器, 喽啰管理器, 战斗管理器, 资源管理器, 实体管理器 };
