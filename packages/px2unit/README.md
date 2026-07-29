# Vite-plugin-px2unit

一个轻量级的 css 单位转换插件，支持像素转换任何 css 单位。

## 使用

```ts
import { px2unit } from "vite-plugin-px2unit";

export default {
  plugins: [
    px2unit({
      to: "rpx",
      transform: (px) => (px / 375) * 750,
      ignoreProperties: [
        "border-width",
        /^font-/,
        (property) => property === "height",
      ],
    }),
  ],
};
```

`ignoreProperties` 用于配置不需要转换的 CSS 属性，支持字符串、正则表达式和函数。字符串会按属性名精确匹配。

## 贡献

首先感谢你考虑为本项目做出贡献！我们欢迎社区成员的贡献，以帮助改进和扩展本项目。

## 执照

本项目采用 MIT 许可证，详细内容请见 [LICENSE](LICENSE) 文件。
