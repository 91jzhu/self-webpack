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
}
module.exports = NormalModule;
