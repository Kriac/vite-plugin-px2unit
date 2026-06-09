import type { Plugin } from "vite";
import type { PostcssPlugin, Px2UnitMatcher, Px2UnitOptions } from "./types";
import valueParser from "postcss-value-parser";

function normalizePath(value: string) {
  return value.replaceAll("\\", "/");
}

function matchesValue(
  value: string,
  matchers: Px2UnitMatcher[] | undefined,
  matchString: (matcher: string, value: string) => boolean,
) {
  return (matchers || []).some((matcher) => {
    if (typeof matcher === "string") {
      return matchString(matcher, value);
    }
    if (matcher instanceof RegExp) {
      return matcher.test(value);
    }
    return matcher(value);
  });
}

function shouldExcludeFile(source: string, options: Px2UnitOptions) {
  const normalizedSource = normalizePath(source);
  return matchesValue(normalizedSource, options.exclude, (matcher, value) =>
    value.includes(normalizePath(matcher)),
  );
}

function shouldIgnoreProperty(property: string, options: Px2UnitOptions) {
  return matchesValue(
    property,
    options.ignoreProperties,
    (matcher, value) => matcher === value,
  );
}

function applyPrecision(value: number, precision: number | undefined) {
  if (precision === undefined) {
    return value;
  }
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}

/**
 * 将 CSS 声明中的 px 单位转换为指定的单位
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
      isExcludeFile = !!filePath && shouldExcludeFile(filePath, options);
    },
    Declaration(decl) {
      if (isExcludeFile || shouldIgnoreProperty(decl.prop, options)) {
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
      (postcssOptions.plugins ??= []).push(postcssPlugin);
    },
  };
}
