const Parser = require("./Parser");

class NormalModule {
  constructor(data) {
    this.name = data.name;
    this.entry = data.enrty;
    this.rawRequest = data.rawRequest;
    this.parser = data.parser; // 等待完成
    this.resource = data.resource;
    this._source = null; // 源码
    this._ast = null; // 源码对应的 ast
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
