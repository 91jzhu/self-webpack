const webpack = require("./rsPack");
// const webpack = require("webpack");
const config = require("./webpack.config");

const compiler = webpack(config);

compiler.run((err, status) => {
  console.log(err);
  console.log(status.toJson());
});
