import { createPostcssPlugin, transformPxValue } from "./index.ts";
import assert from "node:assert/strict";
import postcss from "postcss";

// 将基于 375 宽度设计稿的像素值，按比例换算到 750 宽度设计稿的像素值
const options = {
  to: "rpx",
  transform: (px) => (px / 375) * 750,
};

// 基础转换
assert.equal(transformPxValue("10px solid #fff", options), "20rpx solid #fff");

// 函数和表达式
assert.equal(
  transformPxValue("calc(100% - 12px)", options),
  "calc(100% - 24rpx)",
);

// 负数和小数
assert.equal(transformPxValue("-1.5px .5px 0px", options), "-3rpx 1rpx 0rpx");

// 大小写敏感
assert.equal(transformPxValue("1Px 2PX 3px", options), "1Px 2PX 6rpx");

// URL 中的 px 不应该转换
assert.equal(
  transformPxValue("url(icon-16px.png) 4px", options),
  "url(icon-16px.png) 8rpx",
);

// CSS 变量命名包含 px 不应该转换
assert.equal(
  transformPxValue("var(--space-12px, 6px)", options),
  "var(--space-12px, 12rpx)",
);

// 转换精度
assert.equal(
  transformPxValue("1px 2px", {
    ...options,
    transform: (px) => px / 3,
    precision: 2,
  }),
  "0.33rpx 0.67rpx",
);

const plugin = createPostcssPlugin({
  ...options,
  exclude: [/node_modules[\\/]vant/],
  ignoreProperties: [
    "border-width",
    /^font-/,
    (property) => property === "height",
  ],
});

// 忽略指定文件
const ignoredResult = await postcss([plugin]).process(
  ".button { width: 10px; }",
  {
    from: "node_modules/vant/button.css",
  },
);
assert.equal(ignoredResult.css, ".button { width: 10px; }");

// 忽略指定 CSS 属性
const ignoredPropertiesResult = await postcss([plugin]).process(
  ".button { width: 10px; height: 12px; border-width: 1px; font-size: 14px; margin: 8px; }",
  {
    from: "src/components/button.css",
  },
);
assert.equal(
  ignoredPropertiesResult.css,
  ".button { width: 20rpx; height: 12px; border-width: 1px; font-size: 14px; margin: 16rpx; }",
);
