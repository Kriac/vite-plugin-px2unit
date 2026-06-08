import { defineConfig } from "vite";
import { px2unit } from "vite-plugin-px2unit";
import uni from "@dcloudio/vite-plugin-uni";

export default defineConfig(() => {
  return {
    plugins: [
      px2unit({
        to: "rpx",
        transform: (px) => px * 2,
      }),
      uni(),
    ],
  };
});
