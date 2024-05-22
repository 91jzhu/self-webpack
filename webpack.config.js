const path = require("path");

module.exports = {
  context: process.cwd(),
  entry: "./src/index.js",
  output: {
    filename: "bundle.js",
    path: path.resolve("dist"),
  },
};
