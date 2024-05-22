const { Tapable, SyncHook } = require("tapable");
const async = require("neo-async");
const path = require("path");
const Parser = require("./Parser");
const NormalModuleFactory = require("./NormalModuleFactory");
const Chunk = require("./Chunk");
const ejs = require("ejs");

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
      seal: new SyncHook(),
      beforeChunks: new SyncHook(),
      afterChunks: new SyncHook(),
    };
    this.chunks = []; // 存放当前打包过程中产生的 chunk
    this.assets = [];
    this.files = [];
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
  processDependencies(module, callback) {
    const deps = module.dependcies;
    async.forEach(
      deps,
      (dep, done) => {
        this.createModule(
          {
            name: dep.name,
            context: dep.context,
            rawRequest: dep.rawRequest,
            moduleId: dep.moduleId,
            resource: dep.resource,
            parser: Parser,
          },
          null,
          done
        );
      },
      callback
    );
  }
  seal(callback) {
    this.hooks.seal.call();
    this.hooks.afterChunks.call();
    // 入口模块信息在 compliation 的 entries
    // 生成 chunk 大概步骤：依据入口文件，找到其所有依赖，合并代码，输出
    for (const entryModule of this.entries) {
      // 创建模块，加载，记录信息
      const chunkModule = new Chunk(entryModule);
      // 保存 chunk 信息
      this.chunks.push(chunkModule);
      // 根据 name，相同的为同一 chunk
      chunkModule.modules = this.modules.filter(
        (v) => v.name === chunkModule.name
      );
    }
    // chunk 流程梳理后，开始代码处理，模板文件 + 源码 = chunk.js
    this.hooks.afterChunks.call(this.chunks);
    // 生成代码内容
    this.createChunkAssets();
    callback();
  }
  createChunkAssets() {
    const len = this.chunks.length;
    let fileName, source;
    for (let i = 0; i < len; i++) {
      const chunk = this.chunks[i];
      fileName = chunk.name + ".js";
      chunk.files.push(fileName);
      // 读取模板及内容
      const templatePath = path.join(__dirname, "template/main.ejs");
      const templateCode = this.inputFileSystem.readFileSync(
        templatePath,
        "utf8"
      );
      const templateRender = ejs.compile(templateCode);

      source = templateRender({
        entryModuleId: chunk.entryModule.moduleId,
        modules: chunk.modules,
      });
      // 输出文件
      console.log("source==", source);
      this.emitAssets(fileName, source);
    }
  }
  emitAssets(fileName, source) {
    this.assets[fileName] = source;
    this.files.push(fileName);
  }
}

module.exports = Compilation;
