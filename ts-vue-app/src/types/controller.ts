// ═══════════════════════════════════════════════════════════════
// core/types/controller.ts
// 游戏总控相关类型定义
// ═══════════════════════════════════════════════════════════════

// ─── 资源状态 ───
export interface 资源状态 {
    士气: number;
    最大士气: number;
    催淫母乳: number;
}

// ─── 实体统计 ───
export interface 实体统计 {
    领主数量: number;
    冠军数量: number;
    母畜数量: number;
    地点数量: number;
    喽啰池数量: number;
    喽啰总数: number;
}

// ─── 游戏初始化配置 ───
export interface 游戏初始化配置 {
    领主姓名?: string;
    初始魔力?: number;
    初始士气?: number;
    初始催淫母乳?: number;
    初始喽啰数?: number;
}

// ─── 游戏状态 ───
export interface 游戏状态 {
    回合数: number;
    资源状态: 资源状态;
    实体统计: 实体统计;
    领主魔力: number;
}
