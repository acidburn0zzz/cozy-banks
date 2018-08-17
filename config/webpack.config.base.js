'use strict'

const path = require('path')
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin')
const PostCSSAssetsPlugin = require('postcss-assets-webpack-plugin')
const sortCSSmq = require('sort-css-media-queries')

const { extractor, production } = require('./webpack.vars')
const SRC_DIR = path.resolve(__dirname, '../src')
const pkg = require(path.resolve(__dirname, '../package.json'))
const webpack = require('webpack')
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin');
const StatsPlugin = require('stats-webpack-plugin')

module.exports = {
  output: {
    filename: 'app.js'
  },
  resolve: {
    extensions: ['.js', '.json', '.css', '.jsx'],
    modules: ['node_modules', SRC_DIR]
  },
  module: {
    rules: [
      {
        test: /^((?!min).)*\.jsx?$/, // all js, jsx, exclude minified
        include: [SRC_DIR],
        loader: 'eslint-loader',
        enforce: 'pre',
        options: {
          emitWarning: true,
          fix: true,
          rules: {
            'no-debugger': production ? 2 : 0
          }
        }
      },
      {
        test: /\.jsx?$/,
        include: [
          SRC_DIR,
          path.resolve(__dirname, '../docs'),
          path.dirname(require.resolve('cozy-client')),
          path.dirname(require.resolve('cozy-device-helper')),
          path.dirname(require.resolve('cozy-konnector-libs')),
          path.dirname(require.resolve('cozy-stack-client')),
          path.dirname(require.resolve('cozy-pouch-link'))
        ],
        loader: 'babel-loader',
        options: {
          cacheDirectory: true
        }
      },
      {
        include: SRC_DIR,
        test: /\.styl$/,
        loader: extractor.extract({
          fallback: 'style-loader',
          use: [{
            loader: 'css-loader',
            options: {
              importLoaders: 2,
              modules: true,
              sourceMap: true,
              localIdentName: '[name]_[local]_[hash:base64:5]'
            }
          }, {
            loader: 'stylus-loader',
            options: {
              sourceMap: true
            }
          }]
        })
      },
      {
        test: /\.css$/,
        loader: extractor.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                sourceMap: true,
                plugins: loader => [require('autoprefixer')()]
              }
            }
          ]
        })
      },
      // Fonts
      {
        test: /\.woff2?$/,
        loader: 'file-loader'
      }
    ],
    noParse: [/localforage\/dist/]
  },
  plugins: [
    new webpack.DefinePlugin({
      __APP_VERSION__: JSON.stringify(pkg.version),
      __SENTRY_URL__: JSON.stringify('https://ea2067ca88504d9cbc9115b55d0b2d55:e52e64f57486417bb1b5fa6529e1cfcb@sentry.cozycloud.cc/11'),
    }),
    // ChartJS uses moment :( To remove when we do not use it anymore
    new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en|fr/),
    new webpack.ContextReplacementPlugin(/date-fns[\/\\]locale$/, /en|fr/),
    new ScriptExtHtmlWebpackPlugin({
      defaultAttribute: 'defer'
    }),
    extractor,
    new DuplicatePackageCheckerPlugin({ verbose: true }),
    new PostCSSAssetsPlugin({
      test: /\.css$/,
      plugins: [
        require('autoprefixer')(['last 2 versions']),
        require('css-mqpacker')({sort: sortCSSmq}),
        require('postcss-discard-duplicates'),
        require('postcss-discard-empty')
      ].concat(
        production
          ? require('csswring')({
              preservehacks: true,
              removeallcomments: true
            })
          : []
      )
    })
  ].concat(process.env.WEBPACK_STATS_FILE
    ? [ new StatsPlugin(process.env.WEBPACK_STATS_FILE, {
        chunkModules: true,
        exclude: [/node_modules[\\\/]react/]
      }) ]
    : [])
}
