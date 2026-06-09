import type { UserConfig } from "vite";

/** 提取 vite 中的 PostCSS 配置 */
export type PostcssConfig = Exclude<
  NonNullable<NonNullable<UserConfig["css"]>["postcss"]>,
  string
>;

/** postcss 插件类型 */
export type PostcssPlugin = NonNullable<PostcssConfig["plugins"]>[number];

/** 匹配器，支持函数、正则表达式和字符串 */
export type Px2UnitMatcher = ((value: string) => boolean) | RegExp | string;

/** 插件选项 */
export interface Px2UnitOptions {
  exclude?: Px2UnitMatcher[];
  ignoreProperties?: Px2UnitMatcher[];
  precision?: number;
  to: string;
  transform: (px: number) => number;
}
