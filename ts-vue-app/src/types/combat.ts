// ═══════════════════════════════════════════════════════════════
// core/types/combat.ts
// 战斗系统相关类型定义
// ═══════════════════════════════════════════════════════════════

import type { 武装等级 } from './common';

// ─── 喽啰调配 ───
export interface 分配请求 {
    武装等级: 武装等级;
    数量: number;
}

export interface 分配结果 {
    成功: boolean;
    原因?: string;
    实际分配: number;
    分配详情: Array<{ 等级: string; 数量: number }>;
}

export interface 快速填充结果 {
    成功: boolean;
    原因?: string;
    填充数量: number;
    当前战斗力: number;
    填充详情: Array<{ 等级: string; 数量: number }>;
}

// ─── 战斗部署 ───
export interface 战斗部署 {
    将领ID: string;
    将领: unknown; // 运行时为 冠军实体
    喽啰池: unknown; // 运行时为 喽啰池
    战斗力: number;
}

export interface 战斗配置 {
    目标地点: unknown; // 运行时为 可袭击地点实体
    部署列表: 战斗部署[];
    是否突袭: boolean;
    总行动力消耗: number;
}

// ─── 战斗结果 ───
export interface 战斗结果 {
    成功: boolean;
    胜利: boolean;
    原因?: string;
    我方战斗力: number;
    敌方战斗力: number;
    战损比例?: number;
    俘获母畜?: string[];
    战利品?: Record<string, number>;
}

// ─── 战斗预览 ───
export interface 战斗预览 {
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
}

// ─── 喽啰池管理接口 ───
export interface 喽啰池管理接口 {
    获取无将领喽啰池: () => unknown;
    获取所有将领喽啰池: () => Map<string, unknown>;
}

// ─── 战斗系统依赖 ───
export interface 战斗系统依赖 {
    任务管理器: unknown;
    喽啰池管理: 喽啰池管理接口;
    获取将领: (将领ID: string) => unknown;
    获取地点: (地点ID: string) => unknown;
}
