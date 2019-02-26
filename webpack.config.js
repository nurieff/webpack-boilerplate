const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const safePostCssParser = require('postcss-safe-parser');
const ManifestPlugin = require('webpack-manifest-plugin');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const paths = require('./paths');


const IS_DEV = (process.env.NODE_ENV === 'dev');
const IS_PROD = !IS_DEV;

const isInlineCSS = true;

const publicPath = IS_PROD
  ? paths.servedPath
  : IS_DEV && '/';

const shouldUseRelativeAssetPaths = publicPath === './';

const publicUrl = IS_PROD
  ? publicPath.slice(0, -1)
  : IS_DEV && '';

let optimization = {};
if (IS_PROD) {
  optimization = {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: {
            // we want terser to parse ecma 8 code. However, we don't want it
            // to apply any minfication steps that turns valid ecma 5 code
            // into invalid ecma 5 code. This is why the 'compress' and 'output'
            // sections only apply transformations that are ecma 5 safe
            // https://github.com/facebook/create-react-app/pull/4234
            ecma: 8,
          },
          compress: {
            ecma: 5,
            warnings: false,
            // Disabled because of an issue with Uglify breaking seemingly valid code:
            // https://github.com/facebook/create-react-app/issues/2376
            // Pending further investigation:
            // https://github.com/mishoo/UglifyJS2/issues/2011
            comparisons: false,
            // Disabled because of an issue with Terser breaking valid code:
            // https://github.com/facebook/create-react-app/issues/5250
            // Pending futher investigation:
            // https://github.com/terser-js/terser/issues/120
            inline: 2,
          },
          mangle: {
            safari10: true,
          },
          output: {
            ecma: 5,
            comments: false,
            // Turned on because emoji and regex is not minified properly using default
            // https://github.com/facebook/create-react-app/issues/2488
            ascii_only: true,
          },
        },
        // Use multi-process parallel running to improve the build speed
        // Default number of concurrent runs: os.cpus().length - 1
        parallel: true,
        cache: true,
        sourceMap: IS_DEV,
        // chunkFilter: (chunk) => {
        //   // Exclude uglification for the `vendor` chunk
        //   if (chunk.name === 'vendor') {
        //     return false;
        //   }
        //
        //   return true;
        // },
      }),

      new OptimizeCSSAssetsPlugin({
        cssProcessorOptions: {
          parser: safePostCssParser,
          map: IS_DEV
            ? {
              // `inline: false` forces the sourcemap to be output into a
              // separate file
              inline: false,
              // `annotation: true` appends the sourceMappingURL to the end of
              // the css file, helping the browser find the sourcemap
              annotation: true,
            }
            : false,
        },
      }),
    ],
    // Automatically split vendor and commons
    // https://twitter.com/wSokra/status/969633336732905474
    // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
    splitChunks: {
      //chunks: 'all',
      chunks: 'async',
      name: false,
    },
    // Keep the runtime chunk seperated to enable long term caching
    // https://twitter.com/wSokra/status/969679223278505985
    runtimeChunk: true
  };
}


module.exports = {
  entry: {
    app: paths.appIndexJs
  },


  output: {
    filename: IS_PROD
      ? 'static/js/[name].[chunkhash:8].js'
      : 'static/js/bundle.js',
    chunkFilename: IS_PROD
      ? 'static/js/[name].[chunkhash:8].chunk.js'
      : 'static/js/[name].chunk.js',
    path: paths.appBuild,
    publicPath: publicPath
  },


  optimization: optimization,


  resolve: {
    modules: [
      paths.appNodeModules,
      paths.appSrc
    ]
  },


  plugins: [
    new webpack.DefinePlugin({
      IS_DEV: IS_DEV,
      IS_PROD: IS_PROD
    }),

    new Dotenv(),

    new HtmlWebpackPlugin(
      Object.assign(
        {},
        {
          inject: true,
          template: paths.appHtml,
        },
        IS_PROD
          ? {
            minify: {
              removeComments: true,
              collapseWhitespace: true,
              removeRedundantAttributes: true,
              useShortDoctype: true,
              removeEmptyAttributes: true,
              removeStyleLinkTypeAttributes: true,
              keepClosingSlash: true,
              minifyJS: true,
              minifyCSS: true,
              minifyURLs: true,
            },
          }
          : undefined
      )
    ),

    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: 'static/css/[name].[contenthash:8].css',
      chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
    }),

    new ManifestPlugin({
      fileName: 'asset-manifest.json',
      publicPath: publicPath,
    }),

    new CopyWebpackPlugin([
      {
        from: paths.appPublic,
        to: paths.appBuild,
        test: /^index\.html$/
      },
//      {
//        from: 'node_modules/%PACKAGE%/dist/package.min.js',
//        to: 'static/js',
//        test: /^index\.html$/
//      }
    ], {}),

    new FriendlyErrorsWebpackPlugin({
      compilationSuccessInfo: {
        messages: ['You application is running here http://localhost:3000'],
        notes: ['Some additionnal notes to be displayed unpon successful compilation']
      },
      onErrors: function (severity, errors) {
        // You can listen to errors transformed and prioritized by the plugin
        // severity can be 'error' or 'warning'
      },
      // should the console be cleared between each compilation?
      // default is true
      clearConsole: true,

      // add formatters and transformers (see below)
      additionalFormatters: [],
      additionalTransformers: []
    })
  ],

  externals: {
//    "package": 'Package',
//    "Package": 'Package',
  },

  module: {
    rules: [
      {parser: {requireEnsure: false}},

      {
        test: /\.(js|mjs|jsx)$/,
        enforce: 'pre',
        use: [
          {
            // options: {
            //   //eslintPath: require.resolve('eslint'),
            //   ignore: false,
            //   useEslintrc: false,
            // },
            loader: 'eslint-loader',
          },
        ],
        include: paths.appSrc,
      },

      {
        oneOf: [
          {
            test: [
              /\.bmp$/,
              /\.gif$/,
              /\.jpe?g$/,
              /\.png$/
            ],
            loader: 'url-loader',
            options: {
              limit: 100,
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },

          {
            test: /\.js$/,
            loader: 'babel-loader',
            exclude: /(node_modules)/,
            options: {
              compact: IS_PROD,
              cacheCompression: IS_PROD,
              cacheDirectory: true,
              sourceMaps: IS_DEV,
            }
          },

          // STYLES
          {
            test: /\.css$/,
            use: [
              'style-loader',
              {
                loader: 'css-loader',
                options: {
                  sourceMap: IS_DEV
                }
              },
            ]
          },

          // CSS / SASS
          {
            test: /\.scss/,
            use: [
              IS_PROD && !isInlineCSS ? {
                loader: MiniCssExtractPlugin.loader,
                options: {
                  // you can specify a publicPath here
                  // by default it use publicPath in webpackOptions.output
                  publicPath: '../'
                }
              } : 'style-loader',
              {
                loader: 'css-loader',
                options: {
                  sourceMap: IS_DEV,
                  importLoaders: 1
                }
              },
              {
                loader: 'postcss-loader',
                options: {
                  ident: 'postcss',
                  plugins: () => [
                    require('postcss-flexbugs-fixes'),
                    require('postcss-preset-env')({
                      autoprefixer: {
                        flexbox: 'no-2009',
                        //grid: true.
                        browsers: [
                          '> 1%',
                          'last 3 versions'
                        ]
                      },
                      stage: 3,
                    })
                  ],
                  sourceMap: IS_DEV
                }
              },
              {
                loader: 'sass-loader',
                options: {
                  sourceMap: IS_DEV,
                  //includePaths: [dirAssets]
                  includePaths: [paths.appSrc]
                }
              }
            ]
          },

          // FILES
          {
            loader: 'file-loader',
            include: [
              /(assets\/fonts)/,
            ],
            options: {
              name: 'static/fonts/[name].[hash:8].[ext]',
            }
          },

          // FILES
          {
            loader: 'file-loader',
            exclude: [
              /(assets\/fonts)/,
              /\.(js|mjs|jsx|ts|tsx)$/,
              /\.html$/,
              /\.json$/
            ],
            options: {
              name: 'static/media/[name].[hash:8].[ext]',
            }
          }
        ]
      },

    ]
  }
};