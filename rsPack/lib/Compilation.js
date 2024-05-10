const { Tapable, SyncHook } = require("tapable");
const path = require("path");
const NormalModuleFactory = require("./NormalModuleFactory");

class Compilation extends Tapable {
  constructor(compiler) {
    super();
    this.compiler = compiler;
    this.context = compiler.context;
    this.options = compiler.options;
    // 让 compilation 也具备文件读写能力
    this.inputFileSystem = compiler.inputFileSystem;
    this.outputFileSystem = compiler.outputFileSystem;
    this.entries = []; // 存放所有入口模块信息
    this.modules = []; //  存放所有模块信息
    this.hooks = {
      succeedModule: new SyncHook(["module"]),
    };
  }
  /**
   * 完成模块编译操作
   * @param {*} context 项目根目录
   * @param {*} entry 入口文件 id
   * @param {*} name chunkName 目前是写死的 main
   * @param {*} callback compile 方法里面调用 make 钩子时传递的回调
   */
  addEntry(context, entry, name, callback) {
    this._addModuleChain(context, entry, name, (err, module) => {
      callback(err, module);
    });
  }
  _addModuleChain(context, entry, name, callback) {
    const entryModule = NormalModuleFactory.create({
      name,
      context,
      rawRequest: entry,
      resource: path.join(context, entry),
      parser: () => {},
    });

    const afterBuild = (err) => {
      callback(err, entryModule);
    };
    this.buildModule(entryModule, afterBuild);

    this.entries.push(entryModule);
    this.modules.push(entryModule);
  }
  /**
   * 具体的 build 行为
   * @param {*} module 当前需要被编译的模块
   * @param {*} callback
   */
  buildModule(module, callback) {
    module.build(this, (err) => {
      this.hooks.succeedModule.call(module);
      callback();
    });
  }
}

module.exports = Compilation;
