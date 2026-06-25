const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
const path = require("path");

const cesiumSource = "node_modules/cesium/Build/Cesium";
const cesiumBase = "cesium";

module.exports = {
  transpileDependencies: ["three", "globe.gl", "three-globe"],
  css: {
    extract: false,
  },

  pluginOptions: {
    electronBuilder: {
      preload: "src/preload.js",
      externals: ["better-sqlite3"],
      builderOptions: {
        appId: "com.yourcompany.rocketsim",
        productName: "弹道设计系统",
        win: {
          target: "nsis",
          icon: "build/icon.ico",
        },
        nsis: {
          installerIcon: "build/icon.ico", // 安装程序的图标
          uninstallerIcon: "build/icon.ico", // 卸载程序的图标
          installerHeaderIcon: "build/icon.ico", // 安装界面头部的图标
          oneClick: false, // 设为 false，允许选择安装盘符和路径
          allowToChangeInstallationDirectory: true,
        },
        npmRebuild: true,
        asar: true,
        asarUnpack: ["**/node_modules/better-sqlite3/**/*"],
        extraResources: [
          {
            from: "resources/rocket_core",
            to: "rocket_core",
            filter: ["**/*"],
          },
        ],
      },
    },
  },

  configureWebpack: {
    output: { sourcePrefix: "" },
    amd: { toUrlUndefined: true },
    resolve: {
      alias: { "@": path.resolve(__dirname, "src") },
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.join(cesiumSource, "Workers"),
            to: `${cesiumBase}/Workers`,
          },
          {
            from: path.join(cesiumSource, "ThirdParty"),
            to: `${cesiumBase}/ThirdParty`,
          },
          {
            from: path.join(cesiumSource, "Assets"),
            to: `${cesiumBase}/Assets`,
          },
          {
            from: path.join(cesiumSource, "Widgets"),
            to: `${cesiumBase}/Widgets`,
          },
        ],
      }),
      new webpack.DefinePlugin({
        CESIUM_BASE_URL: JSON.stringify(`./${cesiumBase}`),
      }),
    ],
  },
};
