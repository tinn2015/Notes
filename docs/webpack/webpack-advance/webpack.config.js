//webpack.config.js
const path = require('path')

const HtmlWebpackPlugin = require('html-webpack-plugin');
const isDev = process.env.NODE_ENV === 'development';
const config = require('./public/config')[isDev ? 'dev' : 'build'];
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const webpack = require('webpack')

/* 抽离css */
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

/* 压缩css */
const OptimizeCssPlugin = require('optimize-css-assets-webpack-plugin')

module.exports = {
	mode: isDev ? 'development' : 'production',
	entry: './src/index.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'bundle.[hash:6].js',
		publicPath: '/'  // 这里通常用来配置CDN
	},
	devServer: {
		port: '3000', //默认是8080
		open: true,
		quiet: false, //默认不启用
		inline: true, //默认开启 inline 模式，如果设置为false,开启 iframe 模式
		stats: "errors-only", //终端仅打印 error
		overlay: false, //默认不启用
		clientLogLevel: "silent", //日志等级
		compress: true //是否启用 gzip 压缩
	},
  module: {
      rules: [
          {
              test: /\.jsx?$/,
              use: ['babel-loader'],  //babel是将
              exclude: /node_modules/ //排除 node_modules 目录
					},
					{
						test: /\.(le|c)ss$/,
						// loader的执行顺序是从右向左执行的， less-loader --> postcss-loader --> css-loader --> style-loader
						use: [{
							loader: MiniCssExtractPlugin.loader,
							options: {
								hmr: isDev,
								reloadAll: true
							}
						}, 'css-loader', 'postcss-loader', 'less-loader'],
						exclude: /node_modules/
					},
					{
						test: /\.(png|jpg|gif|jpeg|webp|svg|eot|ttf|woff|woff2)$/,
						use: [
								{
										loader: 'url-loader',
										options: {
												// 将资源转换为 base64 可以减少网络请求次数，但是 base64 数据较大，如果太多的资源是 base64，会导致加载变慢，因此设置 limit 值时，需要二者兼顾
												limit: 10240, //10K
												esModule: false,
												name: '[name]_[hash:6].[ext]'
										}
								}
						],
						exclude: /node_modules/
				}
      ]
	},
	plugins: [
		//数组 放着所有的webpack插件
		new HtmlWebpackPlugin({
			template: './public/index.html',
			filename: 'index.html', //打包后的文件名
			minify: {
					removeAttributeQuotes: false, //是否删除属性的双引号
					collapseWhitespace: false, //是否折叠空白
			},
			config: config.template
				// hash: true //是否加上hash，默认是 false
		}),
		new CleanWebpackPlugin(),
		new CopyWebpackPlugin([
			{
				from: 'public/js/*.js',
				to: path.resolve(__dirname, 'dist', 'js'),
				flatten: true // true表示只拷贝文件夹，忽略文件路劲
			}
		]),
		new webpack.ProvidePlugin({
			Vue: ['vue/dist/vue.esm.js', 'default']
		}),

		/* 抽离css */
		new MiniCssExtractPlugin({
			filename: 'css/[name].css',
			// publicPath: './' 这个跟out中的publicPath 有关， 如果配置cdn这里也要加上cdn
		}),

		/* 压缩css */
		/* 通常生产环境需要 */
		// new OptimizeCssPlugin()
	],
	devtool: isDev ? 'cheap-eval-source-map': 'none'
}
