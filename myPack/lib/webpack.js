const NodeEnvironmentPlugin = require("./node/NodeEnvironmentPlugin");
const Compiler = require("./Compiler");
const WebpackOptionsApply = require("./WebpackOptionsApply");

const webpack = (options) => {
  // 初始化 Compiler 实例
  let compiler = new Compiler(options.context);
  // 配置挂载
  compiler.options = options;
  // 让 Compiler 具备读写文件能力
  new NodeEnvironmentPlugin(options).apply(compiler);
  // 挂载插件
  if (options.plugins && Array.isArray(options.plugins)) {
    for (const plugin of options.plugins) {
      plugin.apply(compiler);
    }
  }
  // 挂载内置默认插件，同时处理入口文件
  compiler.options = new WebpackOptionsApply().process(options, compiler);

  return compiler;
};

module.exports = webpack;
