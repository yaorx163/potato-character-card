// ═══════════════════════════════════════════════════════════════
// core/entities.ts
// 实体基类与所有实体类型定义
// ═══════════════════════════════════════════════════════════════

import type {武装等级, 属性约束配置, 元数据配置, 实体初始数据, 实体基类属性Schema, 领主属性Schema, 冠军属性Schema, 
  母畜属性Schema, 武装分组数据, 武装等级配置, 喽啰池初始数据, 减少喽啰结果, 武装升级结果, 分组详情, 分配喽啰结果, 可袭击地点配置,
   可袭击地点属性Schema, 事件处理器, 冠军初始数据, 领主初始数据, 魔力操作结果, 魔力获得结果, 母畜初始数据, 消耗结果} from '../types/index';

// ═══════════════════════════════════════════════════════════════
// 实体基类
// ═══════════════════════════════════════════════════════════════
class 实体基类<TSchema extends 实体基类属性Schema = 实体基类属性Schema> {
  static 实体计数器: number = 0;

  readonly 实体ID: string;
  readonly 实体类型: string;
  protected 属性容器: Map<string, unknown>;
  protected 元数据: 元数据配置;
  protected 事件监听器: Map<string, 事件处理器[]>;
  protected 属性约束: Map<string, 属性约束配置>;

  constructor(实体类型: string, 初始数据: 实体初始数据 = {}) {
    this.实体类型 = 实体类型;
    this.实体ID = 初始数据.实体ID ?? this.生成唯一ID();
    this.属性容器 = new Map();
    this.元数据 = {
      创建时间: Date.now(),
      ...初始数据.元数据,
    };
    this.事件监听器 = new Map();
    this.属性约束 = 初始数据.属性约束 ?? new Map();
  }

  private 生成唯一ID(): string {
    实体基类.实体计数器++;
    return `${this.实体类型}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}_${实体基类.实体计数器.toString(
      36,
    )}`;
  }

  // ─── 类型安全的属性操作 ───

  /**
   * 设置属性 - 属性名和值类型自动关联
   */
  设置属性<K extends keyof TSchema & string>(属性名: K, 值: TSchema[K]): void {
    const 旧值 = this.属性容器.get(属性名);
    let 处理后的值: TSchema[K] = 值;

    // 数值约束处理
    const 约束 = this.属性约束.get(属性名);
    if (约束 && typeof 值 === 'number') {
      处理后的值 = Math.max(约束.最小值, Math.min(约束.最大值, 值)) as TSchema[K];
    }

    this.属性容器.set(属性名, 处理后的值);
    this.触发事件('属性变更', { 属性名, 旧值, 新值: 处理后的值 });
  }

  /**
   * 获取属性 - 返回类型自动推断
   */
  获取属性<K extends keyof TSchema & string>(属性名: K): TSchema[K];
  获取属性<K extends keyof TSchema & string>(属性名: K, 默认值: TSchema[K]): TSchema[K];
  获取属性<K extends keyof TSchema & string>(属性名: K, 默认值?: TSchema[K]): TSchema[K] | undefined {
    if (this.属性容器.has(属性名)) {
      return this.属性容器.get(属性名) as TSchema[K];
    }
    return 默认值;
  }

  /**
   * 修改数值属性 - 仅适用于 number 类型
   */
  修改属性<K extends keyof TSchema & string>(属性名: TSchema[K] extends number ? K : never, 增量: number): number {
    const 当前值 = (this.获取属性(属性名 as K) ?? 0) as number;
    let 新值 = 当前值 + 增量;

    const 约束 = this.属性约束.get(属性名);
    if (约束) {
      新值 = Math.max(约束.最小值, Math.min(约束.最大值, 新值));
    }

    this.设置属性(属性名 as K, 新值 as TSchema[K]);
    return 新值;
  }

  /**
   * 批量设置属性 - 部分更新
   */
  批量设置属性(属性对象: Partial<TSchema>): void {
    (Object.entries(属性对象) as [keyof TSchema & string, unknown][]).forEach(([属性名, 值]) => {
      this.设置属性(属性名, 值 as TSchema[typeof 属性名]);
    });
  }

  /**
   * 获取所有属性快照
   */
  获取所有属性(): Partial<TSchema> {
    return Object.fromEntries(this.属性容器) as Partial<TSchema>;
  }

  // ─── 约束设置（仅限数值属性）───

  设置属性约束<K extends keyof TSchema & string>(
    属性名: TSchema[K] extends number ? K : never,
    最小值: number,
    最大值: number,
  ): void {
    this.属性约束.set(属性名, { 最小值, 最大值 });
  }

  // ─── 事件系统 ───
  监听事件<T = unknown>(事件名: string, 处理器: 事件处理器<T>): () => void {
    if (!this.事件监听器.has(事件名)) {
      this.事件监听器.set(事件名, []);
    }
    this.事件监听器.get(事件名)!.push(处理器 as 事件处理器);
    return () => {
      const 列表 = this.事件监听器.get(事件名);
      const 索引 = 列表?.indexOf(处理器 as 事件处理器);
      if (索引 !== undefined && 索引 !== -1) {
        列表!.splice(索引, 1);
      }
    };
  }

  触发事件(事件名: string, 数据: unknown = {}): void {
    const 处理器列表 = this.事件监听器.get(事件名) ?? [];
    处理器列表.forEach(处理器 => {
      try {
        处理器(数据, this);
      } catch (错误) {
        console.error(`实体事件处理错误 [${事件名}]:`, 错误);
      }
    });
  }

  销毁(): void {
    this.触发事件('实体销毁');
    this.事件监听器.clear();
  }
}

// ═══════════════════════════════════════════════════════════════
// 领主实体
// ═══════════════════════════════════════════════════════════════

class 领主实体 extends 实体基类<领主属性Schema> {
  constructor(初始数据: 领主初始数据 = {}) {
    super('领主', 初始数据);

    this.设置属性约束('魔力', 0, Infinity);
    this.设置属性约束('最大魔力', 0, Infinity);

    this.设置属性('魔力', 初始数据.魔力 ?? 0);
    this.设置属性('最大魔力', 初始数据.最大魔力 ?? 100);
    this.设置属性('姓名', 初始数据.姓名 ?? '无名领主');
  }

  消耗魔力(数量: number): 魔力操作结果 {
    const 当前魔力 = this.获取属性('魔力');
    if (当前魔力 < 数量) {
      return { 成功: false, 原因: '魔力不足', 当前: 当前魔力, 需要: 数量 };
    }
    this.设置属性('魔力', 当前魔力 - 数量);
    return { 成功: true, 剩余: 当前魔力 - 数量 };
  }

  获得魔力(数量: number): 魔力获得结果 {
    const 当前魔力 = this.获取属性('魔力');
    const 最大魔力 = this.获取属性('最大魔力');
    const 新魔力 = Math.min(当前魔力 + 数量, 最大魔力);
    const 实际获得 = 新魔力 - 当前魔力;

    this.设置属性('魔力', 新魔力);

    return { 实际获得, 当前: 新魔力, 溢出: 数量 - 实际获得 };
  }

  获取魔力百分比(): number {
    const 当前 = this.获取属性('魔力');
    const 最大 = this.获取属性('最大魔力');
    return 最大 > 0 ? (当前 / 最大) * 100 : 0;
  }
}

// ═══════════════════════════════════════════════════════════════
// 冠军实体
// ═══════════════════════════════════════════════════════════════

class 冠军实体 extends 实体基类<冠军属性Schema> {
  管理喽啰池: 喽啰池实体 | null;
  生母: string | null;

  constructor(初始数据: 冠军初始数据 = {}) {
    super('冠军', 初始数据);

    this.设置属性约束('力量', 0, 100);
    this.设置属性约束('敏捷', 0, 100);
    this.设置属性约束('智力', 0, 100);

    this.设置属性('姓名', 初始数据.姓名 ?? '无名冠军');
    this.设置属性('性别', 初始数据.性别 ?? '男');
    this.设置属性('力量', 初始数据.力量 ?? 10);
    this.设置属性('敏捷', 初始数据.敏捷 ?? 10);
    this.设置属性('智力', 初始数据.智力 ?? 10);

    this.设置属性('来源', 初始数据.来源 ?? '');
    this.生母 = 初始数据.生母 ?? null; 

    this.管理喽啰池 = 初始数据.管理喽啰池 ?? new 喽啰池实体({ 将领: this });

  }

  获取喽啰池(): 喽啰池实体 {
    if (!this.管理喽啰池) {
      this.管理喽啰池 = new 喽啰池实体({ 将领: this });
    }
    return this.管理喽啰池;
  }

  计算可统帅喽啰数(): number {
    return this.获取属性('力量');
  }

  计算总属性值(): number {
    return this.获取属性('力量') + this.获取属性('敏捷') + this.获取属性('智力');
  }

  获取效率(属性:'力量' | '敏捷' | '智力'): number  {
    switch (属性) {
      case '力量':
        const 力量 = this.获取属性('力量');
        return 力量 * 力量 / 4000;
      case '敏捷':
        const 敏捷 = this.获取属性('敏捷');
        return 敏捷 * 敏捷 / 4000;
      case '智力':
        const 智力 = this.获取属性('智力');
        return 智力 * 智力 / 4000;
    }
  }

}

// ═══════════════════════════════════════════════════════════════
// 母畜实体
// ═══════════════════════════════════════════════════════════════

class 母畜实体 extends 实体基类<母畜属性Schema> {
  特性列表: Set<string>;
  来源地点ID: string | null;
  冠军生育记录: string[];
  喽啰生育记录: number;

  constructor(配置: 母畜初始数据 = {}) {
    super('母畜');

    this.设置属性约束('臣服度', 0, 100);
    this.设置属性约束('淫乱度', 0, 100);
    this.设置属性约束('魅力', 0, 100);
    this.设置属性约束('总生育力', 0, Infinity);
    this.设置属性约束('剩余生育力', 0, Infinity);

    this.设置属性('姓名', 配置.姓名 ?? '无名');
    this.设置属性('种族', 配置.种族 ?? '人类');
    this.设置属性('年龄', 配置.年龄 ?? 20);
    this.设置属性('原身份', 配置.原身份 ?? '平民');
    this.设置属性('来源', 配置.来源 ?? '未知');
    this.设置属性('描述', 配置.描述 ?? '');

    const 总值 = 配置.总生育力 ?? 100;
    this.设置属性('魅力', 配置.魅力 ?? 10);
    this.设置属性('总生育力', 总值);
    this.设置属性('剩余生育力', 配置.剩余生育力 ?? 总值);
    this.设置属性('淫乱度', 配置.淫乱度 ?? 0);
    this.设置属性('臣服度', 配置.臣服度 ?? 0);

    this.特性列表 = new Set(配置.特性列表 || []);
    this.来源地点ID = 配置.来源地点ID || null;
    this.冠军生育记录 = 配置.冠军生育记录 || [];
    this.喽啰生育记录 = 配置.喽啰生育记录 || 0;
  }

  // 重写设置属性以处理特殊联动逻辑
  设置属性<K extends keyof 母畜属性Schema & string>(属性名: K, 值: 母畜属性Schema[K]): void {
    switch (属性名) {
      case '总生育力':
        if (typeof 值 === 'number'){
          this.属性约束.set('剩余生育力', { 最小值: 0, 最大值: 值 });
          const 当前剩余 = this.属性容器.get('剩余生育力') as number | undefined;
          if (当前剩余 !== undefined && 当前剩余 > 值) {
            this.属性容器.set('剩余生育力', 值);
          }
      }
      break;
      case '魅力':

      break;
    }
    super.设置属性(属性名, 值);
  }
  修改属性<K extends keyof 母畜属性Schema & string>(属性名: 母畜属性Schema[K] extends number ? K : never, 增量: number): number {
    switch (属性名) {
      case '总生育力':

      break;
      case '魅力':

      break;
    }
    return super.修改属性(属性名, 增量);
  }


  获取效率(属性:'魅力' | '淫乱度' | '臣服度' | '淫乱度惩罚'): number  {
    const 淫乱度 = this.获取属性('淫乱度');
    switch (属性) {
      case '魅力':
        const 魅力 = this.获取属性('魅力');
        return 魅力 * 魅力 / 4000;
      case '淫乱度':
        return 淫乱度 * 淫乱度 / 4000;
      case '臣服度':
        const 臣服度 = this.获取属性('臣服度');
        return 臣服度 * 臣服度 / 4000;
      case '淫乱度惩罚':
        return Math.max((125 - 淫乱度) / 100, 0);
    }
  }
  生育冠军消耗(): number{
    return 100
  }
  生育喽啰消耗(): number{
    return 100
  }
  消耗生育力(生育对象: 冠军实体 | null = null): void {
    if (生育对象){
      this.修改属性('剩余生育力', - this.生育冠军消耗());
    }else {
      this.修改属性('剩余生育力', - this.生育喽啰消耗());
    }
  }

  添加特性(特性名: string): void {
    this.特性列表.add(特性名);
  }

  移除特性(特性名: string): void {
    this.特性列表.delete(特性名);
  }

  拥有特性(特性名: string): boolean {
    return this.特性列表.has(特性名);
  }

  记录生育冠军(冠军: 冠军实体): void {
    this.冠军生育记录.push(冠军.实体ID);
  }

  记录生育喽啰(实际产出: number): void {
    if (实际产出 <= 0) return;
    this.喽啰生育记录 += 实际产出;
  }
}

// ═══════════════════════════════════════════════════════════════
// 喽啰池
// ═══════════════════════════════════════════════════════════════

class 喽啰池实体 extends 实体基类 {
  武装分组: Map<武装等级, 武装分组数据>;
  将领: 冠军实体 | null;
  constructor(初始数据: 喽啰池初始数据 = {
    将领: null,
  }) {
    super('喽啰池', 初始数据);
    this.武装分组 = new Map([
      ['未武装', {
          数量: 0,
          战斗力: 100,
          描述: '未经武装的喽啰',
      }],
      ['低级武装', {
          数量: 0,
          战斗力: 110,
          描述: '初级武装的喽啰',
      }],
      ['中级武装', {
          数量: 0,
          战斗力: 120,
          描述: '中级武装的喽啰',
      }],
      ['高级武装', {
          数量: 0,
          战斗力: 160,
          描述: '高级武装的喽啰',
      }],
      ['精英武装', {
          数量: 0,
          战斗力: 300,
          描述: '精英武装的喽啰',
      }],
  ])
    this.将领 = 初始数据.将领 ?? null;
  }

  // ─── 数量操作 ───
  设置将领(将领: 冠军实体): void {
    this.将领 = 将领;
  }

  增加喽啰(数量: number, 武装等级: 武装等级 = '未武装'): void {
    const 分组 = this.武装分组.get(武装等级);
    if (!分组) {
      console.warn(`未知武装等级: ${武装等级}，添加到未武装`);
      this.武装分组.get('未武装')!.数量 += 数量;
      return;
    }
    分组.数量 += 数量;
  }

  减少喽啰(数量: number, 武装等级: 武装等级 = '未武装'): 减少喽啰结果 {
    const 分组 = this.武装分组.get(武装等级);
    if (!分组) return { 成功: false, 原因: '未知武装等级' };

    const 实际减少 = Math.min(数量, 分组.数量);
    分组.数量 -= 实际减少;

    this.武装分组.set(武装等级, 分组);
    console.log(this);

    return {
      成功: true,
      实际减少,
      剩余: 分组.数量,
    };
  }

  获取分组数量(武装等级: 武装等级): number {
    return this.武装分组.get(武装等级)?.数量 ?? 0;
  }

  // ─── 统计 ───

  获取最大数量(): number {
    if (this.将领) {
      return this.将领.计算可统帅喽啰数();
    }
    return Infinity;
  }

  获取总数量(): number {
    let 总数 = 0;
    this.武装分组.forEach(分组 => {
      总数 += 分组.数量;
    });
    return 总数;
  }

  获取分组详情(): 分组详情[] {
    return Array.from(this.武装分组.entries()).map(([等级, 数据]) => ({
      等级,
      ...数据,
    }));
  }

  private 计算总战斗力(): number {
    let 总战力 = 0;
    this.武装分组.forEach(分组 => {
      总战力 += 分组.数量 * (分组.战斗力 / 100);
    });
    return 总战力;
  }

  获取战斗力(): number {
    if (this.将领) {
      const 敏捷 = this.将领.获取属性('敏捷');
      const 智力 = this.将领.获取属性('智力');
      const 部曲战斗力 = this.计算总战斗力();
      const 加权战斗力 = (部曲战斗力 * (智力 + 150)) / 150 + 敏捷 * 10;
      return 加权战斗力;
    }
    return 0;
  }

  获取将领(): 冠军实体 | null {
    return this.将领;
  }
}

// ═══════════════════════════════════════════════════════════════
// 可袭击地点实体
// ═══════════════════════════════════════════════════════════════

class 可袭击地点实体 extends 实体基类<可袭击地点属性Schema> {
  地点名称: string;
  地点类型: string;
  描述: string;
  侦察最大值: number;
  侦察进度: number;
  潜在地点母畜池: Map<string, 母畜实体>;
  已侦察母畜: Map<string, 母畜实体>;
  战斗力估值: number | null;

  constructor(配置: 可袭击地点配置 = {}) {
    super('可袭击地点');

    this.地点名称 = 配置.地点名称 || '未知地点';
    this.地点类型 = 配置.地点类型 || '村庄';
    this.描述 = 配置.描述 || '';
    this.侦察最大值 = 配置.侦察最大值 ?? 100;
    this.侦察进度 = 配置.侦察进度 ?? 0;

    this.设置属性('战斗力', 配置.战斗力 ?? 100);
    this.战斗力估值 = null;

    this.潜在地点母畜池 = new Map();
    this.已侦察母畜 = new Map();
  }

  // ===== 潜在母畜管理 =====

  添加潜在母畜(母畜实体: 母畜实体): void {
    母畜实体.设置属性('来源', this.地点名称);
    this.潜在地点母畜池.set(母畜实体.实体ID, 母畜实体);
  }

  获取随机潜在母畜(): 母畜实体 | null {
    const 母畜列表 = [...this.潜在地点母畜池.values()];
    if (母畜列表.length === 0) return null;

    return 母畜列表[Math.floor(Math.random() * 母畜列表.length)] ?? null;
  }

  标记母畜已侦察(母畜输入: 母畜实体 | string): 母畜实体 | null {
    const 母畜实体ID = typeof 母畜输入 === 'string' ? 母畜输入 : 母畜输入.实体ID;
    const 目标母畜 = this.潜在地点母畜池.get(母畜实体ID);
    if (!目标母畜) return null;

    this.潜在地点母畜池.delete(母畜实体ID);
    this.已侦察母畜.set(母畜实体ID, 目标母畜);
    return 目标母畜;
  }

  移除已捕获母畜(母畜输入: 母畜实体 | string): boolean {
    const 母畜实体ID = typeof 母畜输入 === 'string' ? 母畜输入 : 母畜输入.实体ID;
    return this.已侦察母畜.delete(母畜实体ID);
  }

  增加侦察进度(增量: number): number {
    this.侦察进度 = Math.min(this.侦察进度 + 增量, this.侦察最大值);
    const 真实战斗力 = this.获取属性('战斗力');
    this.战斗力估值 = 真实战斗力 * Math.pow(Math.E, (Math.random() * 2 - 1) * (1 - this.侦察进度 / this.侦察最大值))
    return this.侦察进度;
  }

  是否侦察完成(): boolean {
    return this.侦察进度 >= this.侦察最大值;
  }

  是否存在未侦察母畜(): boolean {
    return this.潜在地点母畜池.size > 0;
  }


  // ===== 母畜查询 =====

  获取所有已侦察母畜(): 母畜实体[] {
    return [...this.已侦察母畜.values()];
  }

  获取母畜(母畜实体ID: string): 母畜实体 | undefined {
    return this.已侦察母畜.get(母畜实体ID) || this.潜在地点母畜池.get(母畜实体ID);
  }

  获取潜在母畜数量(): number {
    return this.潜在地点母畜池.size;
  }

  获取潜在母畜列表(): 母畜实体[] {
    return [...this.潜在地点母畜池.values()];
  }

  获取潜在母畜(): Map<string, 母畜实体> {
    return this.潜在地点母畜池;
  }

  获取已侦察母畜数量(): number {
    return this.已侦察母畜.size;
  }

  获取侦察进度(): number {
    return this.侦察进度;
  }

  获取侦查最大值(): number {
    return Math.max(this.侦察最大值, 1);
  }

  获取战斗力估值(): number | null {
    return this.战斗力估值;
  }
}

// ═══════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════

export { 冠军实体, 可袭击地点实体, 喽啰池实体, 实体基类, 母畜实体, 领主实体 };

export type {
  事件处理器,
  元数据配置,
  冠军初始数据,
  减少喽啰结果,
  分组详情,
  分配喽啰结果,
  可袭击地点配置,
  喽啰池初始数据,
  实体初始数据,
  属性约束配置,
  武装分组数据,
  武装升级结果,
  武装等级配置,
  母畜初始数据,
  消耗结果,
  领主初始数据,
  魔力操作结果,
  魔力获得结果,
};
