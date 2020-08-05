const path = require('path')
const AutoPrefixer = require('autoprefixer')
const nodeExternals = require('webpack-node-externals')

const srcPath = path.join(__dirname, '/lib/index.ts')
const dstPath = path.join(__dirname)

const postcss = {
  loader: 'postcss-loader',
  options: {
    plugins: [AutoPrefixer({})],
  },
}

module.exports = {
  devtool: 'hidden-source-map',
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
      {
        test: /\.scss$/i,
        use: ['style-loader', 'css-loader', postcss, 'sass-loader'],
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
