const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');

const PACKAGE = require('./package.json');

const banner = PACKAGE.name + ' - ' + PACKAGE.version + ' | (c) 2016, ' + new Date().getFullYear() + '  ' + PACKAGE.author + ' | ' + PACKAGE.license + ' | ' + PACKAGE.homepage;

const configuration = {
  cache: true,
  watch: true,
  context: __dirname,
  entry: {
    scripts: ["./example/example.js"],
    styles: ["./example/example.scss"]
  },
  devtool: "eval",
  resolve: {
    enforceExtension: false,
    extensions: [".js"]
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      enforce: 'pre',
      use: [{
        loader: 'eslint-loader'
      }]
    }, {
      test: /\.js$/,
      exclude: /node_modules/,
      use: [{
        loader: 'babel-loader',
        query: {
          presets: [
            'es2015',
            'stage-0'
          ],
          plugins: [
            'syntax-trailing-function-commas',
            'transform-async-to-generator',
            'transform-es2015-destructuring',
            'transform-es2015-parameters',
            'transform-es2015-duplicate-keys',
            'transform-es2015-modules-commonjs',
            'transform-exponentiation-operator',
            'transform-decorators-legacy',
            'transform-flow-strip-types',
            'transform-runtime',
            'syntax-flow'
          ]
        }
      }]
    }, {
        test: /\.(scss|sass)$/,
        use: ExtractTextPlugin.extract({
          fallback: ['style-loader'],
          use: [{
            loader: 'css-loader',
            query: {
              sourceMap: true
            }
          }, {
            loader: 'resolve-url-loader'
          }, {
            loader: 'sass-loader',
            query: {
              sourceMap: true
            }
          }]
        })
    }, {
      test: /\.html$/,
      use: [{
        loader: 'html-loader'
      }]
    }, {
      test: /\.(jpg|png|woff|woff2|eot|ttf|svg|ico)$/,
      use: [{
        loader: 'file-loader?name=[name]-[hash].[ext]'
      }]
    }, {
      test: /\.(json|geojson)$/,
      use: [{
        loader: 'json-loader'
      }]
    }]
  },
  output: {
    pathinfo: true,
    filename: "[name]-[hash].js",
    path: path.resolve("./dist")
  },
  devServer: {
    port: 38142
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
    new ExtractTextPlugin("[name]-[hash].css"),
    new webpack.optimize.CommonsChunkPlugin({
      name: "vendor",
      minChunks: Infinity
    }),
    new HtmlWebpackPlugin({
      template: "./example/example.ejs",
      inject: false,
      minify: {
        collapseWhitespace: true,
        removeComments: true
      }
    }),
    new FriendlyErrorsWebpackPlugin(),
    new webpack.BannerPlugin(banner)
  ]
};

module.exports = configuration;

