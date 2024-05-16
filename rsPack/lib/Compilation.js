const { Tapable, SyncHook } = require("tapable");
const path = require("path");
const Parser = require("./Parser");
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
  /**
   * 定义创建模块方法，达到复用目的
   * @param {*} data 定义模块时需要的属性值
   * @param {*} addEntry 若有，即为入口模块，可以加入 entries
   * @param {*} callback
   */
  createModule(data, addEntry, callback) {
    const module = new NormalModuleFactory().create(data);

    const afterBuild = (err, module) => {
      if (module.dependcies.length) {
        // 依赖了其他模块
        this.processDependencies(module, (err) => {
          callback(err, module);
        });
      } else {
        callback(err, module);
      }
    };
    this.buildModule(module, afterBuild);

    addEntry && addEntry(module);
    this.modules.push(module);
  }
  /**
   * 调用 createModule，完成模块的加载
   * @param {*} context
   * @param {*} entry
   * @param {*} name
   * @param {*} callback
   */
  _addModuleChain(context, entry, name, callback) {
    this.createModule(
      {
        name,
        context,
        parser: Parser,
        resource: path.join(context, entry),
        rawRequest: path.join(context, entry),
        moduleId:
          "." + path.sep + path.relative(context, path.join(context, entry)),
      },
      (entryModule) => {
        this.entries.push(entryModule);
      },
      callback
    );
  }
  /**
   * 具体的 build 行为
   * @param {*} module 当前需要被编译的模块
   * @param {*} callback
   */
  buildModule(module, callback) {
    module.build(this, (err) => {
      this.hooks.succeedModule.call(module);
      callback(err, module);
    });
  }
  // 递归加载模块，必须所有模块都加载完毕再执行回调，neo-async
  processDependencies(module, callback) {}
}

module.exports = Compilation;
