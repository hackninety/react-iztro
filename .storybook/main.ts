import type { StorybookConfig } from "@storybook/react-webpack5";
import path from "path";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    // 关闭 essentials 内置的 actions 面板（隐藏 “Actions” 标签）
    { name: "@storybook/addon-essentials", options: { actions: false } },
    "@storybook/addon-onboarding",
    // 不再引入 addon-interactions（隐藏 “Interactions” 标签；本项目无 play 函数）
  ],
  managerEntries: [path.resolve(__dirname, "./manager.tsx")],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
};
export default config;
