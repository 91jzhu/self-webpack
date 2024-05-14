const {
  Tapable,
  AsyncSeriesHook,
  SyncHook,
  AsyncParallelHook,
  SyncBailHook,
} = require("tapable");
const Compilation = require("./Compilation");
const Stats = require("./Stats");
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
    const finalCallback = (err, stats) => {
      callback && callback(err, stats);
    };

    const onCompiled = (err, compilation) => {
      if (!err) {
        finalCallback(null, new Stats(compilation));
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
      const compilation = this.newCompilation(params);
      this.hooks.make.callAsync(compilation, (err) => {
        callback(err, compilation);
      });
    });
  }
  newCompilationParams() {
    return {
      normalModuleFactory: new NormalModuleFactory(),
    };
  }
  newCompilation(params) {
    const compilation = this.createCompilation();
    this.hooks.thisCompilation.call(compilation, params);
    this.hooks.compilation.call(compilation, params);
    return compilation;
  }
  createCompilation() {
    return new Compilation(this);
  }
}

module.exports = Compiler;
