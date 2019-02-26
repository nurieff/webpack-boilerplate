const merge = require('webpack-merge');
const webpackConfig = require('./webpack.config');
const webpack = require('webpack');
const paths = require('./paths');

module.exports = merge(webpackConfig, {

  devtool: 'eval',

  output: {
    pathinfo: true,
    publicPath: '/',
    filename: '[name].js'
  },

  devServer: {
    quiet: true,
    disableHostCheck: true,
    contentBase: paths.appBuild,
    hot: true,
    inline: true,
    host: '0.0.0.0',
    port: 3000,
    historyApiFallback: {
      // Paths with dots should still use the history fallback.
      // See https://github.com/facebook/create-react-app/issues/387.
      disableDotRule: true,
    }
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ]

});