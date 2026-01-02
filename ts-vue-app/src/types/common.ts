// ═══════════════════════════════════════════════════════════════
// core/types/common.ts
// 共享基础类型定义
// ═══════════════════════════════════════════════════════════════

// ─── 武装等级 ───
export type 武装等级 = '未武装' | '低级武装' | '中级武装' | '高级武装' | '精英武装';

// ─── 属性相关 ───
export interface 属性系数 {
    力量: number;
    敏捷: number;
    智力: number;
}

export interface 属性约束配置 {
    最小值: number;
    最大值: number;
}

// ─── 姓名生成 ───
export interface 姓名池配置 {
    前缀: string[];
    主名: string[];
    后缀: string[];
}

// ─── 数值范围 ───
export interface 数值范围 {
    最小: number;
    最大: number;
}

// ─── 元数据 ───
export interface 元数据配置 {
    创建时间: number;
    [key: string]: unknown;
}

// ─── 事件处理器 ───
export type 事件处理器<T = unknown> = (数据: T, 实体: unknown) => void;
