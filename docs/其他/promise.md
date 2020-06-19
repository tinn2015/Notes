
[promise参考文章](https://juejin.im/post/5e3b9ae26fb9a07ca714a5cc)
## 问题
1. promise 原理
2. promise 手写实现
3. async await 原理

## 首先要说明一下Promise/A+ 规范

1. Promise本质是一个状态机，且状态只能为以下三种：Pending（等待态）、Fulfilled（执行态）、Rejected（拒绝态），状态的变更是单向的，只能从Pending -> Fulfilled 或 Pending -> Rejected，状态变更不可逆

2. then方法接收两个可选参数，分别对应状态改变时触发的回调。then方法返回一个promise。then 方法可以被同一个 promise 调用多次。

## 大白话
1. promise的状态变化是有规则的Pending -> Fulfilled, Pending -> Rejected
2. 一个Promise的then是可以链式调用的，这需要每个then方法返回Promise
3. 后一个then的参数是前一个then 的结果
4. then 接收两个参数 成功回调和失败回调


## promise 实现原理

1. 声明一个myPromise类， new Promise传入一个函数
```javascript
new Promise ((resolve, reject) => {
  setTimeout(() => {
    console.log(1)
  }, 2000)
}).then((res) => {}, (err) => {})

// new promise时执行 Promise类的constructor方法，这里会执行传入的函数(通常是个异步方法，同步方法需要特殊兼容)
// 往往传入的方法是异步方法所以会先执行then方法
```

2. 链式调用
```javascript
then (success, fail) {
  return new Promise((resolve, reject) => {

    let fullfailedFn = (val) => {
      success(val)
      // 这个resolve事为了执行当前这个promise的then
      resolve(val)
    }

    // 每个then都new了一个promise, 这里的this指向上一个then的promise 
    this._resolveQueue.push(val)
  })
}
// 链式调用的核心是then方法return 的是一个promise实例
```

3. 链式调用要确保then 的执行顺序

```javascript

```
