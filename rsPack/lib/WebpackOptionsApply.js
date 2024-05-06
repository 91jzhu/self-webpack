const EntryOptionPlugin = require("./EntryOptionPlugin");

class WebpackOptionsApply {
  process(options, compiler) {
    // 注册监听
    new EntryOptionPlugin().apply(compiler);
    // 触发回调，从而添加 make 监听
    compiler.hooks.entryOption.call(options.context, options.entry);
  }
}

module.exports = WebpackOptionsApply;
