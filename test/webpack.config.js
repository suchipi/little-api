const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: path.resolve(__dirname, "client.js"),
  mode: "development",
  plugins: [new HtmlWebpackPlugin()],
  devServer: {
    port: 8081,
  },
};
