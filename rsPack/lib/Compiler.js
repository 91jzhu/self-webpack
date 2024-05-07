const {
  Tapable,
  AsyncSeriesHook,
  SyncHook,
  AsyncParallelHook,
  SyncBailHook,
} = require("tapable");
const Compilation = require("./Compilation");
const NormalModuleFactory = require("./NormalModuleFactory");

class Compiler extends Tapable {
  constructor(context) {
    super();
    this.context = context;
    this.hooks = {
      done: new AsyncSeriesHook(["stats"]),
      beforeCompile: new AsyncSeriesHook(["params"]),
      compile: new SyncHook(["params"]),
      make: new AsyncParallelHook(["compilation"]),
      afterCompile: new AsyncSeriesHook(["compilation"]),
      entryOption: new SyncBailHook(["context", "entry"]),
      beforeRun: new AsyncSeriesHook(["compiler"]),
      run: new AsyncSeriesHook(["compiler"]),
      thisCompilation: new SyncHook(["compilation", "params"]),
      compilation: new SyncHook(["compilation", "params"]),
    };
  }
  run(callback) {
    console.log("run execute~~~");
    const finalCallback = (err, stats) => {
      console.log("finalCallback~~~");
      callback && callback(err, stats);
    };

    const onCompiled = (err, compilation) => {
      console.log("onCompiled~~~");
      if (!err) {
        finalCallback(null, {
          toJson() {
            return {
              entries: [], // 入口信息
              chunks: [], // chunk 信息
              modules: [], // 模块信息
              assets: [], // 最终生成的资源
            };
          },
        });
      }
    };
    this.hooks.beforeRun.callAsync(this, (err) => {
      this.hooks.run.callAsync(this, (err) => {
        this.compile(onCompiled);
      });
    });
  }
  compile(callback) {
    const params = this.newCompilationParams();
    this.hooks.beforeCompile.callAsync(params, (err) => {
      this.hooks.compile.call(params);
      const compilation = this.newCompilation();
      this.hooks.make.callAsync(compilation, (err) => {
        callback();
        console.log("make执行完毕");
      });
    });
  }
  newCompilationParams() {
    return {
      normalModuleFactory: new NormalModuleFactory(),
    };
  }
  newCompilation() {
    return this.createCompilation();
  }
  createCompilation() {
    return new Compilation(this);
  }
}

module.exports = Compiler;
