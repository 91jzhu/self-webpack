// 遍历 ast
const traverse = require("@babel/traverse").default;
// 生成目标代码
const generator = require("@babel/generator").default;
// 修改 ast
const types = require("@babel/types");
const Parser = require("./Parser");
const path = require("path");

let moduleId = 0;
class NormalModule {
  constructor(data) {
    this.moduleId = data.moduleId;
    this.context = data.context;
    this.name = data.name;
    this.rawRequest = data.rawRequest;
    this.parser = data.parser; // 等待完成
    this.resource = data.resource;
    this._source = null; // 源码
    this._ast = null; // 源码对应的 ast
    this.dependcies = []; // 存储
  }
  /**
   * 读取 module 文件内容
   * 看当前模块是否为 js，不是用 loader 转成 js 模块
   * 转换成 ast
   * 处理模块依赖，递归
   * @param {*} compilation
   * @param {*} callback
   */
  build(compilation, callback) {
    this.doBuild(compilation, (err) => {
      this._ast = new Parser().parse(this._source);

      traverse(this._ast, {
        CallExpression: (nodePath, x, y) => {
          const node = nodePath.node;
          // 找到 require，替换为 __webpack_require__
          if (node.callee.name === "require") {
            // ./app，就是 require 里面的参数
            const modulePath = node.arguments[0].value;
            // 拿到操作系统的分隔符 path.posix.sep
            let moduleName = modulePath.split(path.posix.sep).pop();
            // 只处理 js
            const extName = moduleName.indexOf(".") === -1 ? ".js" : "";
            // app.js
            moduleName += extName;
            // 拼接绝对路径，考虑分隔符
            const realPath = path.join(path.dirname(this.resource), moduleName);
            // context 是项目根目录绝对路径，realPath 是文件绝对路径，做减法可得 src/app.js，妙蛙
            // const moduleId =
            //   "." + path.sep + path.relative(this.context, realPath);
            // 存储当前模块的依赖信息，方便后续递归加载
            this.dependcies.push({
              name: this.name, // 目前写死，后续修改
              context: this.context,
              rawRequest: moduleName,
              resource: realPath,
              moduleId,
            });
            // 替换 require 和其参数
            node.callee.name = "__webpack_require__";
            node.arguments = [types.stringLiteral(String(++moduleId))];
          }
        },
      });
      // 生成目标代码
      const { code } = generator(this._ast);
      this._source = code;
      callback(err);
    });
  }
  doBuild(compilation, callback) {
    this.getResource(compilation, (err, file) => {
      this._source = file;
      callback();
    });
  }
  getResource(compilation, callback) {
    compilation.inputFileSystem.readFile(this.resource, "utf8", callback);
  }
}
module.exports = NormalModule;
