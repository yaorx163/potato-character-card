// ═══════════════════════════════════════════════════════════════
// types/persistence.ts
// 存档系统类型定义
// ═══════════════════════════════════════════════════════════════

import type { 武装等级 } from './common';

/** 领主序列化数据 */
export interface 领主存档数据 {
    实体ID: string;
    姓名: string;
    魔力: number;
    最大魔力: number;
}

/** 冠军序列化数据 */
export interface 冠军存档数据 {
    实体ID: string;
    姓名: string;
    性别: string;
    力量: number;
    敏捷: number;
    智力: number;
    来源: string;
    生母: string;
    喽啰池数据: 喽啰池存档数据 | null;
}

/** 喽啰池序列化数据 */
export interface 喽啰池存档数据 {
    实体ID: string;
    将领ID: string | null;
    武装分组: Array<{
        等级: 武装等级;
        数量: number;
    }>;
}

/** 母畜序列化数据 */
export interface 母畜存档数据 {
    实体ID: string;
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
    特性列表: string[];
    来源地点ID: string | null;
    冠军生育记录: string[];
    喽啰生育记录: number;
}

/** 可袭击地点序列化数据 */
export interface 地点存档数据 {
    实体ID: string;
    地点名称: string;
    地点类型: string;
    描述: string;
    侦察最大值: number;
    侦察进度: number;
    战斗力: number;
    战斗力估值: number | null;
    潜在母畜列表: 母畜存档数据[];
    已侦察母畜列表: 母畜存档数据[];
}

/** 资源状态存档数据 */
export interface 资源存档数据 {
    士气: number;
    最大士气: number;
    催淫母乳: number;
}

/** 完整游戏存档数据 */
export interface 游戏存档数据 {
    版本号: string;
    存档时间: number;
    存档名称: string;
    回合数: number;
    领主: 领主存档数据;
    冠军列表: 冠军存档数据[];
    母畜列表: 母畜存档数据[];
    地点列表: 地点存档数据[];
    无将领喽啰池: 喽啰池存档数据;
    资源状态: 资源存档数据;
}

/** 存档槽位信息 */
export interface 存档槽位 {
    槽位索引: number;
    存档名称: string;
    存档时间: number;
    回合数: number;
    领主姓名: string;
    冠军数量: number;
    母畜数量: number;
}
