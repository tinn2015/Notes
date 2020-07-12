## entry(入口起点): 
指示webpack使用哪个模块来作为构建其内部依赖图的开始

## output: 
告诉webpack将创建的bundles输出到哪里

## loader: 
本质上就是将不同类型的文件转化为 webpack能够处理的有效模块。

## plugins
插件就是给webpack赋能， 实现打包优化压缩等

## webpack 模块
webpack模块可以通过以下方式表达他们的依赖关系：

- ES5 import 语句
- CommonJS require语句
- AMD defined 和 require语句
- css/less/sass @import 语句
- 样式中的url html 中的 img  src=""

## manifest
当编译器开始执行、解析和映射应用程序时，会保留所有模块的详细要点，这个数据集合称为 manifest

在代码运行时浏览器会根据manifest 来解析加载模块， 无论那种模块化语法，import 或者 require 都会转换为__webpack_require__ 方法。 这个方法指向模块标识符， 运行时根据模块标识符通过manifest 查询到对应的弄块。