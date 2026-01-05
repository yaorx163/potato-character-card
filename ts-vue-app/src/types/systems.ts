// ═══════════════════════════════════════════════════════════════
// core/types/systems.ts
// 系统管理器相关类型定义
// ═══════════════════════════════════════════════════════════════

import type { 武装等级 } from './common';
import type { 母畜实体, 冠军实体, 可袭击地点实体, 领主实体, 喽啰池实体 } from '../core/entities';
import type { 战斗结果 } from './managers';
import type { 领主创建配置 } from './factories';
import type { 任务管理器, 回合管理器, 实体管理器, 战斗管理器, 法术管理器, 资源管理器, 黑市管理器 } from '@/core/managers';
import type { 工厂管理器 } from '@/core/factories';
import type { 存档管理器, 游戏存档数据 } from '@/core/persistence';

// ─── 通用实体引用类型 ───
// 使用字符串字面量避免循环引用，运行时由具体模块处理
export type 可执行实体 = 冠军实体 | 母畜实体;
export type 可目标实体 = 母畜实体 | 可袭击地点实体 | 喽啰池实体 | null;
export type 实体类型 = 冠军实体 | 母畜实体 | 可袭击地点实体 | 领主实体 | 喽啰池实体;

// ─── 任务系统 ───

export interface 属性变化记录 {
    [属性名: string]: [number | string, number | string];
}

export type 任务前置条件 = (执行人: 实体类型) => boolean;
export type 行动力占用计算 = (执行人: 实体类型) => number;
export type 任务执行效果 = (执行人: 实体类型, 目标: 实体类型 | null, 游戏总控?: 游戏总控接口) => 任务执行结果;

export interface 任务配置 {
    名称: string;
    描述: string;
    目标实体类型: '母畜实体' | '可袭击地点实体' | '领主实体' | '冠军实体' | '可袭击地点实体-母畜实体' | null;
    执行人实体类型: '冠军实体' | '母畜实体' | '领主实体';
    前置条件: {
        类型?: 任务前置条件;
        臣服度?: 任务前置条件;
        淫乱度?: 任务前置条件;
        生育力?: 任务前置条件;
    };
    行动力占用?: 行动力占用计算;
    执行效果: 任务执行效果;
    信息?: string;
}

export interface 任务系统接口 {
    注册任务: (任务名: string, 配置: 任务配置) => void;
}

export interface 任务执行结果 {
    成功: boolean;
    类型: string;
    执行人: 实体类型;
    目标: 实体类型 | null;
    变化?: 属性变化记录;
    已侦察母畜?: 母畜实体[];
    已获取母畜?: 母畜实体[];
    已获取冠军?: 冠军实体[];
    信息?: string;
    原因?: string;
}

export interface 已发布任务 {
    任务ID: string;
    任务名: string;
    执行人ID: string;
    目标ID: string | null;
    行动力占用: number;
    发布时间: number;
    执行人: 实体类型;
    目标: 实体类型 | null;
}

export interface 任务结算结果 {
    任务ID: string;
    结果: 任务执行结果;
}

// ─── 法术系统 ───

export type 法术执行效果 = (法术倍率: number, 目标: 实体类型 | null, 游戏总控: 游戏总控接口) => 法术执行结果;


export interface 法术配置 {
    名称: string;
    价格: number;
    目标类型: '冠军实体' | '母畜实体' | '可袭击地点实体' | '领主实体' | '喽啰池实体' | null;
    描述: string;
    法术倍率上限: number;
    信息?: string;
    执行效果: 法术执行效果;
}

export interface 法术系统接口 {
    注册法术: (法术名: string, 配置: 法术配置) => void;
}

export interface 法术执行结果 {
    成功: boolean;
    类型: string;
    目标: 实体类型 | null;
    变化?: 属性变化记录;
}



export interface 法术使用记录 {
    法术名: string;
    倍率: number;
    消耗魔力: number;
    目标ID: string | null;
    信息?: string;
}

// ─── 黑市系统 ───
export type 商品执行效果 = (购买数量: number, 目标: 实体类型 | null, 游戏总控: 游戏总控接口) => 商品执行结果;

export interface 商品执行效果结果 {
    成功: boolean;
    类型: string;
    目标: 可目标实体 | 母畜实体 | null;
    信息?: string;
    变化?: Record<string, [number | string, number | string]>;
}


export interface 商品配置 {
    名称: string;
    价格: number;
    目标类型: '无' | '母畜实体' | '可袭击地点实体' | '领主实体' | '冠军实体' | null;
    类型: '消耗品' | '装备' | '道具' | '材料';
    描述: string;
    每周限购: number;
    信息?: string;
    执行效果: 商品执行效果;
}

export interface 黑市系统接口 {
    注册商品: (商品名: string, 配置: 商品配置) => void;
}

export interface 商品执行结果 {
    成功: boolean;
    类型: string;
    目标: 实体类型 | null;
    信息?: string;
    变化?: 属性变化记录;
}

export interface 商品实例 {
    商品ID: string;
    配置: 商品配置;
    本周已购买: number;
}

export interface 商品购买记录 {
    商品ID: string;
    目标: 实体类型 | null;
    数量: number;
    总价: number;
    信息?: string;
}

export interface 奴隶商品 {
    商品ID: string;
    母畜实体: 母畜实体;
    价格: number;
    已售出: boolean;
}

export interface 奴隶刷新配置 {
    刷新数量范围: { 最小: number; 最大: number };
    价格计算: (母畜: 母畜实体) => number;
}

export interface 购买结果 {
    成功: boolean;
    原因?: string;
    消耗催淫母乳?: number;
    执行结果?: 商品执行结果;
}

export interface 奴隶购买结果 {
    成功: boolean;
    原因?: string;
    消耗催淫母乳?: number;
    获得母畜?: 母畜实体;
}

// ─── 回合系统 ───
export interface 回合结算摘要 {
    回合数: number;
    任务记录: string[];
    法术记录: string[];
    商品记录: string[];
    战斗记录: string[];
}

// ─── 游戏总控接口 ───
export interface 游戏总控接口 {
    readonly 地点管理: {
        获取地点: (地点ID: string) => 可袭击地点实体 | null;
        添加地点: (地点: 可袭击地点实体) => void;
        获取所有地点: () => 可袭击地点实体[];
    };

    readonly 母畜管理: {
        从劝诱获取母畜: (母畜: 母畜实体) => void;
        移除母畜: (母畜: 母畜实体) => void;
        添加母畜: (母畜: 母畜实体) => void;
        获取母畜: (母畜ID: string) => 母畜实体 | null;
        获取所有母畜: () => 母畜实体[];
    };

    readonly 冠军管理: {
        从生育获取冠军: (冠军: 冠军实体) => void;
        添加冠军: (冠军: 冠军实体) => void;
        获取冠军: (冠军ID: string) => 冠军实体 | null;
        获取所有冠军: () => 冠军实体[];
    };

    readonly 喽啰池管理: {
        获取喽啰总数: () => number;
        获取无将领喽啰池: () => 喽啰池实体;
        可升级数量: (目标等级: 武装等级) => number;
        武装升级: (数量: number, 武装等级: 武装等级) => boolean;
        自动分配: () => boolean;
        清空所有将领喽啰池: () => void;
    };

    readonly 资源管理: {
        获取士气: () => number;
        修改士气: (增量: number) => number;
        获取最大士气: () => number;
        获取催淫母乳数量: () => number;
        修改催淫母乳数量: (增量: number) => number;
    };

    readonly 实体管理: {
        获取实体: (实体ID: string) => 实体类型 | null;
    };

    readonly 领主管理: {
        创建领主: (配置: 领主创建配置) => 领主实体;
        获取领主: () => 领主实体;
        设置领主: (领主: 领主实体) => void;
        修改魔力: (增量: number) => number;
    };

    readonly 系统管理: {
        获取资源管理器: () => 资源管理器;
        获取实体管理器: () => 实体管理器;
        获取工厂管理器: () => 工厂管理器;
        获取战斗管理器: () => 战斗管理器;
        获取任务管理器: () => 任务管理器;
        获取法术管理器: () => 法术管理器;
        获取黑市管理器: () => 黑市管理器;
        获取回合管理器: () => 回合管理器;
    };

    readonly 战斗管理: {
        执行战斗: () => any;
    };

    readonly 回合管理: {
        获取当前回合: () => number;
        结束回合: () => any;
        获取游戏状态: () => any;
    };

    readonly 存档管理: {

    };
}

