const webpack = require('webpack');

function configuration (config, webpack) {
  config.set({
    basePath: '',
    frameworks: ["jasmine"],
    files: [
      "source/**/*.spec.js"
    ],
    preprocessors: {
      "**/*.spec.js": ["webpack", "sourcemap"]
    },
    webpack: {
      devtool: 'inline-source-map',
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
          test: /\.html$/,
          use: [{
            loader: 'raw-loader'
          }]
        }, {
          test: /\.(jpg|png|woff|woff2|eot|ttf|svg|ico)$/,
          use: [{
            loader: 'null-loader'
          }]
        }, {
          test: /\.(json|geojson)$/,
          use: [{
            loader: 'json-loader'
          }]
        }, {
          test: /\.js$/,
          exclude: [
            /\.spec\.js$/,
            /node_modules/
          ],
          enforce: 'post',
          use: [{
            loader: 'istanbul-instrumenter-loader'
          }]
        }]
      },
      externals: {},
      plugins: []
    },
    webpackMiddleware: {
      noInfo: true,
      stats: 'errors-only'
    },
    port: 38121,
    colors: true,
    logLevel: config.LOG_INFO,
    singleRun: false,
    autoWatch: true,
    concurrency: Infinity,
    reporters: ['mocha', 'junit', 'coverage'],
    browsers: ['PhantomJS'],
    junitReporter: {
      outputDir: '.tmp/unit-tests/'
    },
    browserNoActivityTimeout: 200000,
    mochaReporter: {
      output: 'autowatch'
    },
    coverageReporter: {
      dir: '.tmp/coverage/',
      subdir: function (browser) {
        return browser.toLowerCase().split(/[ /-]/)[0];
      },
      reporters: [
        // { type: "html" },
        { type: "text-summary" },
        { type: "cobertura", file: "cobertura-coverage.xml" }
      ],
      mime: {
        'text/javascript': ['js']
      }
    }
  });
}

module.exports = configuration;
