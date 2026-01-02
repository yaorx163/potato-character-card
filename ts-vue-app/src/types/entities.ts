// ═══════════════════════════════════════════════════════════════
// core/types/entities.ts
// 实体相关类型定义
// ═══════════════════════════════════════════════════════════════

import type { 冠军实体, 喽啰池实体 } from '../core/entities';
import type { 属性约束配置, 元数据配置, 武装等级 } from './common';

// ─── 实体基类 ───
export interface 实体初始数据 {
    元数据?: Partial<元数据配置>;
    属性约束?: Map<string, 属性约束配置>;
}

export interface 实体基类属性Schema {
    [key: string]: unknown;
}

// ─── 领主 ───
export interface 领主属性Schema extends 实体基类属性Schema {
    魔力: number;
    最大魔力: number;
    姓名: string;
}

export interface 领主初始数据 extends 实体初始数据 {
    魔力?: number;
    最大魔力?: number;
    姓名?: string;
}

export interface 魔力操作结果 {
    成功: boolean;
    原因?: string;
    当前?: number;
    需要?: number;
    剩余?: number;
}

export interface 魔力获得结果 {
    实际获得: number;
    当前: number;
    溢出: number;
}

// ─── 冠军 ───
export interface 冠军属性Schema extends 实体基类属性Schema {
    姓名: string;
    性别: string;
    力量: number;
    敏捷: number;
    智力: number;
    来源: string;
    生母: string;
}

export interface 冠军初始数据 extends 实体初始数据 {
    姓名?: string;
    性别?: string;
    力量?: number;
    敏捷?: number;
    智力?: number;
    管理喽啰池?: 喽啰池实体;
    来源?: string;
    生母?: string;
}

// ─── 母畜 ───
export interface 母畜属性Schema extends 实体基类属性Schema {
    姓名: string;
    种族: string;
    年龄: number;
    原身份: string;
    来源: string;
    描述: string;
    总生育力: number;
    剩余生育力: number;
    淫乱度: number;
    臣服度: number;
    魅力: number;
}

export interface 母畜特性 {
    序号: number;
    特性名称?: string;
    描述?: string;
}

export interface 母畜初始数据 extends 实体初始数据 {
    姓名?: string;
    种族?: string;
    年龄?: number;
    原身份?: string;
    来源?: string;
    描述?: string;
    总生育力?: number;
    剩余生育力?: number;
    魅力?: number;
    淫乱度?: number;
    臣服度?: number;
    特性列表?: string[];
    来源地点ID?: string | null;
    冠军生育记录?: string[];
    喽啰生育记录?: number;
    母畜特性列表?: 母畜特性[];
}

export interface 消耗结果 {
    成功: boolean;
    原因?: string;
    当前?: number;
    需要?: number;
    剩余?: number;
}

// ─── 喽啰池 ───
export interface 武装分组数据 {
    数量: number;
    战斗力: number;
    描述: string;
}

export interface 武装等级配置 {
    战斗力?: number;
    描述?: string;
}

export interface 喽啰池初始数据 extends 实体初始数据 {
    将领: 冠军实体 | null;
    武装分组?: Map<武装等级, 武装分组数据>;
}

export interface 减少喽啰结果 {
    成功: boolean;
    原因?: string;
    实际减少?: number;
    剩余?: number;
}

export interface 武装升级结果 {
    升级数量: number;
    溢出数量: number;
}

export interface 分组详情 {
    等级: 武装等级;
    数量: number;
    战斗力: number;
    描述: string;
}

export interface 分配喽啰结果 {
    成功: boolean;
    原因?: string;
    分配数量: number;
    未满足数量?: number;
    分配详情: Array<{ 等级: string; 数量: number }>;
}

// ─── 可袭击地点 ───
export interface 可袭击地点属性Schema extends 实体基类属性Schema {
    战斗力: number;
}

export interface 可袭击地点配置 {
    地点名称?: string;
    地点类型?: string;
    描述?: string;
    侦察最大值?: number;
    侦察进度?: number;
    战斗力?: number;
}
