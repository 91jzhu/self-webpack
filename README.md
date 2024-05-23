# 仿写 webpack
## 目的：完成 commonjs 文件打包
### 学习心得：了解了 webpack 内部如何启动一次完整的编译流程，插件的执行原理，同时复习了 path、fs 等 node 模块的知识，以及明白了 webpack 是如何实现 commonjs 的 polyfill，自己实现了一套模块的加载流程（webpack_require）

---

### 学习了一些 npm 包的使用
1. @babel/traverse：遍历 ast 语法树
2. ejs：模板引擎，插值生成不同文件
3. neo-async：所有异步操作完成后执行回调
4. tapable：各种 hooks 用法

---

### 使用方式
1. npm i
2. node run.js
3. 在 dist 目录手动创建 html 文件并导入，即可预览
