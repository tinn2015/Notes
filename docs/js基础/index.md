[基础题](https://juejin.im/post/5ee03947e51d457889262921)

## let 

- let 只在代码块有效
- 不存在变量提升
- 暂时性死区（不受外部影响， 必须先声明）

## 0.1 + 0.1 != 0.3
因为浮点数运算精度得问题。

js 得计算都要转为二进制
```javascript
// 将0.1转换成二进制
console.log(0.1.toString(2)); // 0.0001100110011001100110011001100110011001100110011001101

// 将0.2转换成二进制
console.log(0.2.toString(2));  // 0.001100110011001100110011001100110011001100110011001101
```

由于浮点数用二进制表达时是无穷的,所以两者相加后，因浮点数小数位的限制而截断的二进制数字，再转换为十进制，就成了 0.30000000000000004，所以在进行算术计算时会产生误差。

## == 与 ===

首先
```javascript
null == undefined

null === undefined
```

== 会先比较类型， 如果类型不同则会先转换类型：
```javascript
1. true, false 分别转换为 1，0  
2. 数字 == 字符串， 把字符串转为数字再比较
3. 对象 == 数字/字符串， 把对象转为原始值再比较
```

## use strict

严格模式是在ES5中引入的，它可以视为JS的一个子集，在严格模式下，限制了JS的标准使用下一些行为。

- 严格模式消除了一些 JavaScript的静默错误，通过改变它们来抛出错误。
- 严格的模式修复了 JavaScript引擎难以执行优化的错误：有时候，严格模式代码可以比非严格模式的相同的代码运行得更快。
- 严格模式禁用了在ECMAScript的未来版本中可能会定义的一些语法。
但是需要注意的是：不支持严格模式的浏览器将会执行与支持严格模式的浏览器不同行为的严格模式代码。所以不要依靠严格模式，而是应当加强自己代码的鲁棒性

1. 无法静默升级全局变量
```javascript
"use strict";
v = 1; // 报错，v未声明
for(i = 0; i < 2; i++) { // 报错，i未声明
}
```
2. 函数参数命名唯一
```javascript
function sum(a, a, c){ // !!! 语法错误
  "use strict";
  return a + a + c; // 代码运行到这里会出错
}
```
3. 对象的属性名必须唯一
```javascript
"use strict";
var o = { p: 1, p: 2 }; // !!! 语法错误
```

4. 任何在正常模式下引起静默失败的赋值操作 (给不可赋值的全局变量赋值，给不可写属性赋值, 给只读属性(getter-only)赋值赋值, 给不可扩展对象(non-extensible object)的新属性赋值) 都会抛出异常

```javascript
"use strict";
NaN = 1; // 不可复制的全局变量
var o = {
  get v() {
    return this.v
  }
};
Object.defineProperty(o, "v", { value: 1, writable: false }); // 不可写的属性
o.v = 2; // 报错

var o1 = {
  get v() { return 1; }  // 只读属性
};
o1.v = 2; // 报错

// 给不可扩展对象的新属性赋值
var fixed = {};
Object.preventExtensions(fixed);
fixed.newProp = "ohai"; // 抛出TypeError错误
```

5. 对未来的兼容
- 增加了一些保留字
在严格模式中一部分字符变成了保留的关键字。这些字符包括implements, interface, let, package, private, protected, public, static和yield

## decodeURI（）和encodeURI（）是什么
encodeURI()用于将URL转为十六进制编码，而decodeURI()用于将编码的URL转换成正常的URL。


