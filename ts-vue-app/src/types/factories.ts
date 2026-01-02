// ═══════════════════════════════════════════════════════════════
// core/types/factories.ts
// 工厂相关类型定义
// ═══════════════════════════════════════════════════════════════
import { 冠军实体, 可袭击地点实体, 母畜实体, 领主实体 } from '../core/entities';

import type { 姓名池配置, 属性系数, 数值范围 } from './common';

// ─── 生育效率表 ───
// export interface 生育效率表 {
//     身份系数表: Map<string, 属性系数>;
//     种族系数表: Map<string, 属性系数>;
// }

// ─── 冠军工厂 ───
export interface 冠军工厂配置 {
    冠军姓名池: 姓名池配置;
    生育消耗: number;
    属性随机浮动范围: number;
    前缀概率: number;
    后缀概率: number;
    母畜种族配置: Map<string, 种族配置数据>;
    母畜身份配置: Map<string, 身份配置数据>;
}

export interface 生育选项 {
    姓名?: string;
    性别?: string;
}

export interface 属性预估范围 {
    最小: number;
    最大: number;
    期望: number;
}

export interface 生育属性预估 {
    力量: 属性预估范围;
    敏捷: 属性预估范围;
    智力: 属性预估范围;
}

// ─── 母畜工厂 ───
export interface 种族配置数据 {
    姓名池: 姓名池配置;
    前缀概率: number;
    后缀概率: number;
    生育系数: 属性系数;
    生育力基础值: number;
    魅力系数: number;
}

export interface 身份配置数据 {
    最小年龄: number;
    最大年龄: number;
    生育系数: 属性系数;
    生育力系数: number;
    魅力基础值: number;
}

export interface 母畜工厂配置 {
    种族配置: Map<string, 种族配置数据>;
    身份配置: Map<string, 身份配置数据>;
}

export interface 母畜创建配置 {
    姓名?: string;
    种族?: string;
    身份?: string;
    年龄?: number;
    来源?: string;
    描述?: string;
    魅力?: number;
    来源地点ID?: string;
    总生育力?: number;
    剩余生育力?: number;
    捕获回合?: number;
}

// ─── 领主工厂 ───
export interface 领主工厂配置 {
    初始魔力: number;
    最大魔力: number;
    默认姓名: string;
}

export interface 领主创建配置 {
    魔力?: number;
    最大魔力?: number;
    姓名?: string;
}

// ─── 可袭击地点工厂 ───
export interface 身份分布权重 {
    [key: string]: number;
}

export interface 种族分布权重 {
    [key: string]: number;
}

export interface 地点名称池 {
    描述: string;
    前缀: string[];
    中缀: string[];
    后缀: string[];
}

export interface 地点类型配置数据 {
    地点名称池: 地点名称池;
    战斗力范围: 数值范围;
    侦察最大值: number;
    母畜数量范围: 数值范围;
    身份分布: 身份分布权重;
    种族分布: 种族分布权重;
}

export interface 可袭击地点工厂配置 {
    地点类型配置?: Map<string, 地点类型配置数据>;
}

export interface 地点创建配置 {
    名称?: string;
    描述?: string;
    战斗力?: number;
    侦察进度?: number;
    侦察最大值?: number;
    母畜数量?: number;
}

// ─── 运行时配置 ───
export interface 运行时配置接口 {
    冠军配置?: 冠军工厂配置;
    母畜配置?: 母畜工厂配置;
    领主配置?: 领主工厂配置;
    地点配置?: 可袭击地点工厂配置;
}
