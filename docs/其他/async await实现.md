## 背景

promise的链式调用解决的嵌套回调的问题，但是过多的链式调用可读性任然不佳，因此es7提出asyn函数

```javascript
Promise.resolve(a)
  .then(b => {
    // do something
  })
  .then(c => {
    // do something
  })

```
async/await
```javascript
async () => {
  const a = await Promise.resolve(a);
  const b = await Promise.resolve(b);
  const c = await Promise.resolve(c);
}

```

## 实现

<span style="color: #237804; font-size: 20px; font-weight: bold">async/await实际上是对Generator（生成器）的封装</span>

> Generator出现不就就被async/await所取代

> ES6 新引入了 Generator 函数，可以通过 yield 关键字，把函数的执行流挂起，通过next()方法可以切换到下一个状态，为改变执行流程提供了可能，从而为异步编程提供解决方案。

### Generator 实现

Generator的语法是*/yield

Generator 函数是一个普通函数，但是有两个特征。一是，function关键字与函数名之间有一个星号；二是，函数体内部使用yield表达式，定义不同的内部状态（yield在英语里的意思就是“产出”）

```javascript
function* myGenerator() {
  console.log(yield '1')  //test1
  console.log(yield '2')  //test2
  console.log(yield '3')  //test3
}

// 获取迭代器
const gen = myGenerator();

gen.next()
gen.next('test1')
gen.next('test2')
gen.next('test3')

```

与async/await的区别

- async/await自带执行器，不需要手动调用next()就能自动执行下一步
- async函数返回值是Promise对象，而Generator返回的是生成器对象
- await能够返回Promise的resolve/reject的值

<span style="color: #237804; font-size: 20px; font-weight: bold">我们对async/await的实现，其实也就是对应以上三点封装Generator</span>

1. 自执行

```javascript
function run(gen) {
  var g = gen()                     //由于每次gen()获取到的都是最新的迭代器,因此获取迭代器操作要放在_next()之前,否则会进入死循环

  function _next(val) {             //封装一个方法, 递归执行g.next()
    var res = g.next(val)           //获取迭代器对象，并返回resolve的值
    if(res.done) return res.value   //递归终止条件
    res.value.then(val => {         //Promise的then方法是实现自动迭代的前提
      _next(val)                    //等待Promise完成就自动执行下一个next，并传入resolve的值
    })
  }
  _next()  //第一次执行
}

```

```javascript
function* myGenerator() {
  console.log(yield Promise.resolve(1))   //1
  console.log(yield Promise.resolve(2))   //2
  console.log(yield Promise.resolve(3))   //3
}

run(myGenerator)
```
主要就是封装一个run方法， 里面可以自动执行next



## 先总结

async/await 是对Generator的封装，通过自执行generator的next。