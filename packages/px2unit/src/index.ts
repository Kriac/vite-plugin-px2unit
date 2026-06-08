import type { Plugin, UserConfig } from "vite";
import valueParser from "postcss-value-parser";

type PostcssConfig = Exclude<
  NonNullable<NonNullable<UserConfig["css"]>["postcss"]>,
  string
>;
type PostcssPlugin = NonNullable<PostcssConfig["plugins"]>[number];

/** 排除路径的匹配器，支持字符串、正则表达式和函数 */
export type Px2UnitExclude = ((source: string) => boolean) | RegExp | string;

/** 插件选项 */
export interface Px2UnitOptions {
  exclude?: Px2UnitExclude[];
  precision?: number;
  to: string;
  transform: (px: number) => number;
}

function normalizePath(value: string) {
  return value.replaceAll("\\", "/");
}

function shouldExclude(source: string | undefined, options: Px2UnitOptions) {
  if (!source) {
    return false;
  }
  const normalizedSource = normalizePath(source);
  return (options.exclude || []).some((matcher) => {
    if (typeof matcher === "string") {
      return normalizedSource.includes(normalizePath(matcher));
    }
    if (matcher instanceof RegExp) {
      return matcher.test(normalizedSource);
    }
    return matcher(normalizedSource);
  });
}

function applyPrecision(value: number, precision: number | undefined) {
  if (precision === undefined) {
    return value;
  }
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}

/**
 * 将 css 声明中的 px 单位转换为指定的单位。
 */
export function transformPxValue(value: string, options: Px2UnitOptions) {
  const parsedValue = valueParser(value);
  parsedValue.walk((node) => {
    if (node.type !== "word") {
      return;
    }
    const parsedUnit = valueParser.unit(node.value);
    if (!parsedUnit || parsedUnit.unit !== "px") {
      return;
    }
    const nextValue = applyPrecision(
      options.transform(Number(parsedUnit.number)),
      options.precision,
    );
    node.value = `${nextValue}${options.to}`;
  });
  return parsedValue.toString();
}

/**
 * 创建将 px 转换为指定单位的 postcss 插件
 */
export function createPostcssPlugin(options: Px2UnitOptions): PostcssPlugin {
  let isExcludeFile = false;
  return {
    postcssPlugin: "postcss-px2unit",
    Once(css) {
      const filePath = css.source?.input.file;
      isExcludeFile = shouldExclude(filePath, options);
    },
    Declaration(decl) {
      if (isExcludeFile) {
        return;
      }
      decl.value = transformPxValue(decl.value, options);
    },
  };
}

/**
 * 将 px 转换为指定单位的 Vite 插件
 */
export function px2unit(options: Px2UnitOptions): Plugin {
  const postcssPlugin = createPostcssPlugin(options);
  return {
    name: "vite-plugin-px2unit",
    config(config) {
      config.css ??= {};
      const postcssOptions = (config.css.postcss ??= {});
      if (typeof postcssOptions === "string") {
        throw new Error("PostCSS plugins must be configured as an array.");
      }
      postcssOptions.plugins = [
        ...(postcssOptions.plugins ?? []),
        postcssPlugin,
      ];
    },
  };
}
