// ═══════════════════════════════════════════════════════════════
// core/systems.js
// 系统逻辑核心：任务、黑市、法术管理器
// ═══════════════════════════════════════════════════════════════

class 任务管理器 {
  constructor(上下文) {
    this.ctx = 上下文; // 包含 实体池, 全局资源(如母乳), 随机数生成器等
    this.任务配置表 = new Map();
    this.当前回合任务队列 = [];
    this.已占用实体ID = new Set();
  }

  注册任务(任务ID, 配置) {
    this.任务配置表.set(任务ID, 配置);
  }

  // ─── 任务发布阶段 ───

  检查可用性(任务ID, 执行者, 目标) {
    const 配置 = this.任务配置表.get(任务ID);
    if (!配置) return { 可用: false, 原因: '未知任务' };

    // 1. 检查占用
    if (this.已占用实体ID.has(执行者.实体ID)) return { 可用: false, 原因: '执行者正忙' };
    if (目标 && this.已占用实体ID.has(目标.实体ID)) return { 可用: false, 原因: '目标正忙' };

    // 2. 检查行动力/资源 (简单检查，具体在执行时双重确认)
    // 3. 检查前置条件 (执行配置中的 check 函数)
    if (配置.前置条件 && !配置.前置条件(执行者, 目标, this.ctx)) {
      return { 可用: false, 原因: '前置条件未满足' };
    }

    return { 可用: true };
  }

  发布任务(任务ID, 执行者, 目标) {
    const 检查 = this.检查可用性(任务ID, 执行者, 目标);
    if (!检查.可用) throw new Error(检查.原因);

    const 任务实例 = {
      实例ID: Date.now() + '_' + Math.random(),
      任务ID,
      执行者ID: 执行者.实体ID,
      目标ID: 目标 ? 目标.实体ID : null,
      执行者快照: 执行者, // 保持引用以便结算
      目标快照: 目标,
    };

    this.当前回合任务队列.push(任务实例);
    this.已占用实体ID.add(执行者.实体ID);
    if (目标) this.已占用实体ID.add(目标.实体ID);

    return 任务实例;
  }

  取消任务(任务实例ID) {
    const 索引 = this.当前回合任务队列.findIndex(t => t.实例ID === 任务实例ID);
    if (索引 === -1) return false;

    const 任务 = this.当前回合任务队列[索引];
    this.已占用实体ID.delete(任务.执行者ID);
    if (任务.目标ID) this.已占用实体ID.delete(任务.目标ID);

    this.当前回合任务队列.splice(索引, 1);
    return true;
  }

  // ─── 回合结算阶段 ───

  结算所有任务() {
    const 结算报告 = [];

    // 按顺序执行 (实际逻辑中可能需要按敏捷或其他属性排序，此处按发布顺序)
    for (const 任务 of this.当前回合任务队列) {
      const 配置 = this.任务配置表.get(任务.任务ID);
      const 执行者 = 任务.执行者快照;
      const 目标 = 任务.目标快照;

      try {
        // 再次检查条件（防止因资源扣除导致的连锁失效）
        // 扣除行动力/资源
        const 消耗结果 = 配置.消耗处理 ? 配置.消耗处理(执行者, this.ctx) : true;

        if (消耗结果) {
          // 执行效果
          const 效果结果 = 配置.执行效果(执行者, 目标, this.ctx);
          结算报告.push({
            任务: 配置.名称,
            执行者: 执行者.获取属性('姓名'),
            成功: true,
            结果: 效果结果,
          });
        } else {
          结算报告.push({ 任务: 配置.名称, 成功: false, 原因: '消耗不足' });
        }
      } catch (e) {
        console.error(e);
        结算报告.push({ 任务: 配置.名称, 成功: false, 原因: '执行错误' });
      }
    }

    // 清理状态
    this.当前回合任务队列 = [];
    this.已占用实体ID.clear();

    return 结算报告;
  }
}

class 黑市管理器 {
  constructor(上下文) {
    this.ctx = 上下文;
    this.商品库 = new Map();
    this.周限购记录 = new Map(); // Map<商品ID, 已购买次数>
    this.奴隶池 = []; // 本周刷新的奴隶列表
  }

  注册商品(商品ID, 配置) {
    this.商品库.set(商品ID, 配置);
  }

  // 每周开始时调用
  刷新黑市() {
    this.周限购记录.clear();
    this.刷新奴隶池();
  }

  刷新奴隶池() {
    this.奴隶池 = [];
    // 根据外部规则生成0-3个奴隶实体暂存
    if (this.ctx.生成黑市奴隶) {
      const 数量 = Math.floor(Math.random() * 4); // 0-3
      this.奴隶池 = this.ctx.生成黑市奴隶(数量);
    }
  }

  购买商品(商品ID, 目标 = null, 额外参数 = {}) {
    // 奴隶特殊处理
    if (商品ID === '奴隶') {
      return this.购买奴隶(额外参数.奴隶索引);
    }

    const 商品 = this.商品库.get(商品ID);
    if (!商品) return { 成功: false, 原因: '商品不存在' };

    // 1. 检查限购
    const 已购 = this.周限购记录.get(商品ID) || 0;
    if (商品.每周限购 !== Infinity && 已购 >= 商品.每周限购) {
      return { 成功: false, 原因: '商品已售罄' };
    }

    // 2. 检查货币 (催淫母乳)
    if (this.ctx.全局资源.催淫母乳数量 < 商品.价格) {
      return { 成功: false, 原因: '催淫母乳不足' };
    }

    // 3. 执行交易
    this.ctx.全局资源.催淫母乳数量 -= 商品.价格;
    this.周限购记录.set(商品ID, 已购 + 1);

    // 4. 应用效果
    const 结果 = 商品.执行效果(目标, this.ctx);

    return { 成功: true, 剩余资源: this.ctx.全局资源.催淫母乳数量, 效果结果: 结果 };
  }

  购买奴隶(索引) {
    if (索引 < 0 || 索引 >= this.奴隶池.length) return { 成功: false, 原因: '无效的选择' };
    const 奴隶 = this.奴隶池[索引];

    // 假设奴隶价格动态计算或固定，此处需补全配置读取
    const 价格 = 奴隶.获取属性('总雌性价值') / 10; // 示例定价逻辑

    if (this.ctx.全局资源.催淫母乳数量 < 价格) {
      return { 成功: false, 原因: '催淫母乳不足' };
    }

    this.ctx.全局资源.催淫母乳数量 -= 价格;
    this.奴隶池.splice(索引, 1); // 移除

    // 将奴隶实体正式加入玩家阵营
    this.ctx.接收新母畜(奴隶);

    return { 成功: true, 获得: 奴隶 };
  }
}

class 法术管理器 {
  constructor(上下文) {
    this.ctx = 上下文;
    this.法术库 = new Map();
    this.本回合已施法 = false;
  }

  注册法术(法术ID, 配置) {
    this.法术库.set(法术ID, 配置);
  }

  重置回合状态() {
    this.本回合已施法 = false;
  }

  释放法术(法术ID, 目标 = null) {
    if (this.本回合已施法) return { 成功: false, 原因: '本回合已释放过法术' };

    const 法术 = this.法术库.get(法术ID);
    if (!法术) return { 成功: false, 原因: '未知法术' };

    const 领主 = this.ctx.获取玩家领主();

    // 检查并消耗魔力
    const 消耗结果 = 领主.消耗魔力(法术.价格);
    if (!消耗结果.成功) return { 成功: false, 原因: '魔力不足' };

    // 执行效果
    const 效果结果 = 法术.执行效果(目标, this.ctx);

    this.本回合已施法 = true;
    return { 成功: true, 效果结果 };
  }
}

export { 任务管理器, 黑市管理器, 法术管理器 };
