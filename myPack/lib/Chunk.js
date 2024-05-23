class Chunk {
  constructor(entryModule) {
    this.entryModule = entryModule;
    this.name = entryModule.name;
    this.files = []; // 记录每个 chunk 的文件信息
    this.modules = []; // 当前 chunk 包含的所有模块
  }
}
module.exports = Chunk;
