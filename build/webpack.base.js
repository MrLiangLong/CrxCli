const webpack = require('webpack')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const config = require('./config').base


module.exports = {
  devtool: 'none',// 'source-map',
  output: {
    filename: "[name].js" // 打包后输出文件的文件名
  },
  resolve: {
    extensions: ['.js', '.vue', '.json']
  },
  module: {
    rules: [{
      test: /\.js$/,
      use: {
        loader: 'babel-loader'
      },
      exclude: /node_modules/
    }, {
      test: /\.css/,
      use: [
        'vue-style-loader',
        'css-loader',
        'postcss-loader'
      ]
    }, {
      test: /\.vue$/,
      loader: "vue-loader"
    }, {
      test: /\.less$/,
      use: [
        'vue-style-loader',
        'css-loader',
        {
          loader: 'less-loader',
          options: {
            javascriptEnabled: true
          }
        }
      ]
    }, {
      test: /\.(png|jpe?g|gif)(\?.*)?$/,
      use: [{
        loader: "url-loader",
        options: {
          limit: 100000,
          name: 'static/img/[name].[ext]' // 将图片都放入 images 文件夹下，[hash:7]防缓存
        }
      }]
    },
      {
        test: /\.(woff2?|eot|ttf|otf|svg)(\?.*)?$/,
        use: [{
          loader: "url-loader",
          options: {
            limit: 1000,
            name: 'static/fonts/[name].[ext]' // 将字体放入 fonts 文件夹下
          }
        }]
      }]
  },
  plugins: [
    new webpack.DefinePlugin(config.globals),
    new VueLoaderPlugin()
  ]
}
