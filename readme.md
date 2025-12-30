# 代码结构

```txt
src/
├── core/
│   ├── entities.js      - 实体基类与实体类型
│   ├── registries.js    - 注册表系统
│   └── factories.js     - 工厂类
├── systems/
│   ├── event-bus.js     - 事件总线
│   ├── formula.js       - 公式引擎
│   ├── time.js          - 时间系统
│   ├── resource.js      - 资源系统
│   ├── task.js          - 任务系统
│   ├── intel.js         - 情报系统
│   ├── combat.js        - 战斗系统
│   ├── breeding.js      - 繁殖系统
│   ├── spell.js         - 法术系统
│   └── market.js        - 黑市系统
├── config/
│   ├── attributes.js    - 属性配置
│   ├── tasks.js         - 任务配置
│   ├── spells.js        - 法术配置
│   ├── items.js         - 商品配置
│   └── formulas.js      - 公式配置
├── game/
│   ├── state.js         - 游戏状态
│   ├── controller.js    - 游戏控制器
│   └── plugin.js        - 插件系统
└── index.js             - 入口文件
```
