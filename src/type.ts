
export interface TypedString {
  [key: string]: string
}

export interface ReplaceTarget {
  // 匹配规则
  pattern: string;
  // 目标
  target?: string | string[];
  // 替换
  replace?: string;
  // 多个替换 => {'A': 'B'}，多个目标集合，multiple字段存在时，target和replace将不在生效
  multiple?: TypedString;
  // 项目名称，用于备份
  name?: string;
  // 指定根目录
  root?: string;
  // 正则符号
  flags?: string;
}

export type ReplaceTargets = ReplaceTarget[];

// 替换参数
export interface StartReplaceOptions {
  targets: ReplaceTargets;
  excludes: string[];
  root?: string;
}

// 删除参数
export interface StartCleanOptions {
  targets: string[];
  excludes: string[];
  root?: string;
}


