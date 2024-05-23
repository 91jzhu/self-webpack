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
const path = require("path");
const mkdirp = require("mkdirp");

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
      emit: new AsyncSeriesHook(["compilation"]),
    };
  }
  emitAssets(compilation, callback) {
    // 按需创建 dist，执行文件写操作
    // console.log(this.options, this, 99999);
    const targetPath = this.options.output.path || "dist";
    // 生成文件
    const emitFiles = (err) => {
      const assets = compilation.assets;
      for (let fileName in assets) {
        const source = assets[fileName];
        const outputPath = path.join(targetPath, fileName);
        this.outputFileSystem.writeFileSync(outputPath, source, "utf8");
      }
      callback(err);
    };
    // 创建目录
    this.hooks.emit.callAsync(compilation, (err) => {
      mkdirp.sync(targetPath);
      emitFiles(err);
    });
  }
  run(callback) {
    const finalCallback = (err, stats) => {
      callback && callback(err, stats);
    };
    const onCompiled = (err, compilation) => {
      if (!err) {
        // 将处理好的 chunk 写入到指定文件并输出至 dist
        this.emitAssets(compilation, (err) => {
          const stats = new Stats(compilation);
          finalCallback(err, stats);
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
      const compilation = this.newCompilation(params);
      this.hooks.make.callAsync(compilation, (err) => {
        // 开始处理 chunk
        compilation.seal((err) => {
          this.hooks.afterCompile.callAsync(compilation, (err) => {
            callback(err, compilation);
          });
        });
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
