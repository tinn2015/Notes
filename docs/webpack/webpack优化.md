[webpack优化](https://juejin.im/post/5e6cfdc85188254913107c1f#heading-11)

## speed-measure-webpack-plugin

可以测量 各个插件和loader花费的时间，这个插件与HotModuleReplacementPlugin

## babel 转义时配置exclude、include 可以优化打包时间

## cache-loader

在一些性能开销较大的loader前添加cache-loader 将结果缓存到磁盘中。

## happypack

开通多个子进程去执行打包

## thread-loader

把thread-loader 放在其他loader前面， 那么再thread-loader之后的loader就会在一个单独的worker中运行。

## webpack默认使用TerserWebpackPlugin 默认是开启多进程和缓存

## HardSourceWebpackPlugin

为模块提供中间件缓存， 默认缓存路径 node_modules/.cache/hard-source

## noParse 

标注一些没有AMD/CommonJS规范的模块， webpack会引入这些模块但是不进行转换和解析， 从而提升性能。

## IgnorePlugin
webpack 内置插件， 可以忽略第三方包的指定目录。

## extrenal
前面有说 提供全局变量

## DllPlugin

这个主要是用来分包， 将一些更新频率不高的库打包到一起，如vue, vue-router, vuex等

实现：

- 先配置一个webpack.config.dll.js

```javascript
//webpack.config.dll.js
const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: {
        react: ['react', 'react-dom']
    },
    mode: 'production',
    output: {
        filename: '[name].dll.[hash:6].js',
        path: path.resolve(__dirname, 'dist', 'dll'),
        library: '[name]_dll' //暴露给外部使用
        //libraryTarget 指定如何暴露内容，缺省时就是 var
    },
    plugins: [
        new webpack.DllPlugin({
            //name和library一致
            name: '[name]_dll', 
            path: path.resolve(__dirname, 'dist', 'dll', 'manifest.json') //manifest.json的生成路径
        })
    ]
}

```

- 增加package.json

```javascript
{
    "scripts": {
        "dev": "NODE_ENV=development webpack-dev-server",
        "build": "NODE_ENV=production webpack",
        "build:dll": "webpack --config webpack.config.dll.js"
    },
}

```

- 修改webpack.config.js

```javascript
//webpack.config.js
const webpack = require('webpack');
const path = require('path');
module.exports = {
    //...
    devServer: {
        contentBase: path.resolve(__dirname, 'dist')
    },
    plugins: [
      // 这里就是将之前打包好的dll 引入到项目中
        new webpack.DllReferencePlugin({
            manifest: path.resolve(__dirname, 'dist', 'dll', 'manifest.json')
        }),
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: ['**/*', '!dll', '!dll/**'] //不删除dll目录
        }),
        //...
    ]
}

```
- 在index.html 中引入dll

## 抽离公共代码

optimization.splitChunks

```javascript
splitChunks: {
    // 表示选择哪些 chunks 进行分割，可选值有：async，initial和all
    chunks: "async",
    // 表示新分离出的chunk必须大于等于minSize，默认为30000，约30kb。
    minSize: 30000,
    // 表示一个模块至少应被minChunks个chunk所包含才能分割。默认为1。
    minChunks: 1,
    // 表示按需加载文件时，并行请求的最大数目。默认为5。
    maxAsyncRequests: 5,
    // 表示加载入口文件时，并行请求的最大数目。默认为3。
    maxInitialRequests: 3,
    // 表示拆分出的chunk的名称连接符。默认为~。如chunk~vendors.js
    automaticNameDelimiter: '~',
    // 设置chunk的文件名。默认为true。当为true时，splitChunks基于chunk和cacheGroups的key自动命名。
    name: true,
    // cacheGroups 下可以可以配置多个组，每个组根据test设置条件，符合test条件的模块，就分配到该组。模块可以被多个组引用，但最终会根据priority来决定打包到哪个组中。默认将所有来自 node_modules目录的模块打包至vendors组，将两个以上的chunk所共享的模块打包至default组。
    cacheGroups: {
        vendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10
        },
        // 
    default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true
        }
    }
}

```

webpack-bundle-analyzer  可以查看哪些包体积较大，对于重复的包， 可以在splitChunks中再拆分

## webpack 自身的优化
- tree-shaking
- babel配置优化


# webpack 优化的总结

- 一方面是打包速度的优化
- 一方面是打包体积的优化 

