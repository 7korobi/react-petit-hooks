const path = require('path')
const nodeExternals = require("webpack-node-externals")

const srcPath = path.join(__dirname, '/lib/index.ts')
const dstPath = path.join(__dirname)

module.exports = {
  devtool: "hidden-source-map",
  entry: {
    index: srcPath,
  },
  output: {
    path: dstPath,
    filename: '[name].js',
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json'],
  },
  externals: [
    nodeExternals({
      allowlist: [],
    }),
  ],
}
