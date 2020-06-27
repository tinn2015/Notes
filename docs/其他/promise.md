
[promise参考文章](https://juejin.im/post/5e3b9ae26fb9a07ca714a5cc)
## 问题
1. promise 原理
2. promise 手写实现
3. async await 原理

## 首先要说明一下Promise/A+ 规范

1. Promise本质是一个状态机，且状态只能为以下三种：Pending（等待态）、Fulfilled（执行态）、Rejected（拒绝态），状态的变更是单向的，只能从Pending -> Fulfilled 或 Pending -> Rejected，状态变更不可逆

2. then方法接收两个可选参数，分别对应状态改变时触发的回调。then方法返回一个promise。then 方法可以被同一个 promise 调用多次。

3. then的参数必须是function, 如诺不是则忽略继续执行后面的then

## 大白话
1. promise的状态变化是有规则的Pending -> Fulfilled, Pending -> Rejected
2. 一个Promise的then是可以链式调用的，这需要每个then方法返回Promise
3. 后一个then的参数是前一个then 的结果
4. then 接收两个参数 成功回调和失败回调


## promise 实现原理

- then的时候就是将success和fail的方法加入到队列
- resolve就是执行success 的队列
- reject 就是执行 fail的队列

1. 声明一个myPromise类， new Promise传入一个函数
```javascript
new Promise ((resolve, reject) => {
  setTimeout(() => {
    console.log(1)
    resolve(res)
  }, 2000)
}).then((res) => {}, (err) => {})

// new promise时执行 Promise类的constructor方法，这里会执行传入的函数(通常是个异步方法，同步方法需要特殊兼容)
// 往往传入的方法是异步方法所以会先执行then方法
// 
```

执行顺序
```mermaid
graph LR

new-promise --> then收集回调 --> resolve/reject执行回调 

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
    this._resolveQueue.push(fullfailedFn)
  })
}
// 链式调用的核心是then方法return 的是一个promise实例
```

3. 链式调用要确保then 的执行顺序

**这里要注意then里面再执行一个promise**

```javascript
then (success, fail) {
  return new Promise((resolve, reject) => {

    let fullfailedFn = (val) => {
      let x = success(val)

      /* 判断success是不是promise */

      /* 如果then里面还是promise, 那么执行这个promise的then */

      /* 这里的then传入的是return 的promise 的resolve和reject, 这是为了将x的结果 传给 下一个then */

      /* 这个resolve就是执行return出来的这个promise的then */
      x instanceof MyPromise ? x.then(resolve, reject) : resolve(x)
    }

    // 每个then都new了一个promise, 这里的this指向上一个then的promise 
    this._resolveQueue.push(fullfailedFn)
  })
  
}

```

4. 穿透值 & 状态变更

两点
- then的参数必须是fucntion
- 必须确保then在resolve之前执行

```javascript
  // 根据规范，如果then的参数不是function，则我们需要忽略它, 让链式调用继续往下执行
    typeof resolveFn !== 'function' ? resolveFn = value => value : null
    typeof rejectFn !== 'function' ? rejectFn = reason => {
      throw new Error(reason instanceof Error? reason.message:reason);
    } : null

    switch (this._status) {
      // 当状态为pending时,把then回调push进resolve/reject执行队列,等待执行
      case PENDING:
        this._resolveQueue.push(fulfilledFn)
        this._rejectQueue.push(rejectedFn)
        break;
      // 当状态已经变为resolve/reject时,直接执行then回调
      case FULFILLED:
        fulfilledFn(this._value)    // this._value是上一个then回调return的值(见完整版代码)
        break;
      case REJECTED:
        rejectedFn(this._value)
        break;
    }
```
5. 兼容同步任务
为了保证promise的执行顺序， 先收集回调再执行回调，所以同步任务需要异步执行，这里用setTimeOut实现
```javascript
let _resolve = (val) => {
      //把resolve执行回调的操作封装成一个函数,放进setTimeout里,以兼容executor是同步代码的情况
      const run = () => {
        if(this._status !== PENDING) return   // 对应规范中的"状态只能由pending到fulfilled或rejected"
        this._status = FULFILLED              // 变更状态
        this._value = val                     // 储存当前value

        // 这里之所以使用一个队列来储存回调,是为了实现规范要求的 "then 方法可以被同一个 promise 调用多次"
        // 如果使用一个变量而非队列来储存回调,那么即使多次p1.then()也只会执行一次回调
        while(this._resolveQueue.length) {    
          const callback = this._resolveQueue.shift()
          callback(val)
        }
      }
      setTimeout(run)
    }

```

## 其他功能

1. Promise.prototype.catch()

```javascript
//catch方法其实就是执行一下then的第二个回调
catch(rejectFn) {
  return this.then(undefined, rejectFn)
}

```

2. Promise.resolve()

```javascript
//静态的resolve方法
static resolve(value) {
  if(value instanceof MyPromise) return value // 根据规范, 如果参数是Promise实例, 直接return这个实例
  return new MyPromise(resolve => resolve(value)) //promise里的resolve是为了改变当前promise状态Pending --> Fullfilled, 这样是为了后面的then可以继续执行
}

```

3. Promise.prototype.finally()

finally()方法返回一个Promise。在promise结束时，无论结果是fulfilled或者是rejected，都会执行指定的回调函数。在finally之后，还可以继续then。并且会将值原封不动的传递给后面的then

```javascript

//finally方法
finally(callback) {
  return this.then(
    value => MyPromise.resolve(callback()).then(() => value),             // MyPromise.resolve执行回调,并在then中return结果传递给后面的Promise
    reason => MyPromise.resolve(callback()).then(() => { throw reason })  // reject同理
  )
}

```
4. Promise.all()

> Promise.all(iterable)方法返回一个 Promise 实例，此实例在 iterable 参数内所有的 promise 都“完成（resolved）”或参数中不包含 promise 时回调完成（resolve）；如果参数中  promise 有一个失败（rejected），此实例回调失败（reject），失败原因的是第一个失败 promise 的结果。

```javascript
//静态的all方法
static all(promiseArr) {
  let index = 0
  let result = []
  return new MyPromise((resolve, reject) => {
    promiseArr.forEach((p, i) => {
      //Promise.resolve(p)用于处理传入值不为Promise的情况
      MyPromise.resolve(p).then(
        val => {
          index++
          result[i] = val
          //所有then执行后, resolve结果
          if(index === promiseArr.length) {
            resolve(result)
          }
        },
        err => {
          //有一个Promise被reject时，MyPromise的状态变为reject
          reject(err)
        }
      )
    })
  })
}

```

5. Promise.race()
> 就是传入的所有promise中一旦有一个执行完毕， 无论resolve还是reject, 就直接返回promise

```javascript
static race(promiseArr) {
  return new MyPromise((resolve, reject) => {
    //同时执行Promise,如果有一个Promise的状态发生改变,就变更新MyPromise的状态
    for (let p of promiseArr) {
      MyPromise.resolve(p).then(  //Promise.resolve(p)用于处理传入值不为Promise的情况
        value => {
          resolve(value)        //注意这个resolve是上边new MyPromise的
        },
        err => {
          reject(err)
        }
      )
    }
  })
}

```

## 完整代码

```javascript
//Promise/A+规定的三种状态
const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

class MyPromise {
  // 构造方法接收一个回调
  constructor(executor) {
    this._status = PENDING     // Promise状态
    this._value = undefined    // 储存then回调return的值
    this._resolveQueue = []    // 成功队列, resolve时触发
    this._rejectQueue = []     // 失败队列, reject时触发

    // 由于resolve/reject是在executor内部被调用, 因此需要使用箭头函数固定this指向, 否则找不到this._resolveQueue
    let _resolve = (val) => {
      //把resolve执行回调的操作封装成一个函数,放进setTimeout里,以兼容executor是同步代码的情况
      const run = () => {
        if(this._status !== PENDING) return   // 对应规范中的"状态只能由pending到fulfilled或rejected"
        this._status = FULFILLED              // 变更状态
        this._value = val                     // 储存当前value

        // 这里之所以使用一个队列来储存回调,是为了实现规范要求的 "then 方法可以被同一个 promise 调用多次"
        // 如果使用一个变量而非队列来储存回调,那么即使多次p1.then()也只会执行一次回调
        while(this._resolveQueue.length) {    
          const callback = this._resolveQueue.shift()
          callback(val)
        }
      }
      setTimeout(run)
    }
    // 实现同resolve
    let _reject = (val) => {
      const run = () => {
        if(this._status !== PENDING) return   // 对应规范中的"状态只能由pending到fulfilled或rejected"
        this._status = REJECTED               // 变更状态
        this._value = val                     // 储存当前value
        while(this._rejectQueue.length) {
          const callback = this._rejectQueue.shift()
          callback(val)
        }
      }
      setTimeout(run)
    }
    // new Promise()时立即执行executor,并传入resolve和reject
    executor(_resolve, _reject)
  }

  // then方法,接收一个成功的回调和一个失败的回调
  then(resolveFn, rejectFn) {
    // 根据规范，如果then的参数不是function，则我们需要忽略它, 让链式调用继续往下执行
    typeof resolveFn !== 'function' ? resolveFn = value => value : null
    typeof rejectFn !== 'function' ? rejectFn = reason => {
      throw new Error(reason instanceof Error? reason.message:reason);
    } : null
  
    // return一个新的promise
    return new MyPromise((resolve, reject) => {
      // 把resolveFn重新包装一下,再push进resolve执行队列,这是为了能够获取回调的返回值进行分类讨论
      const fulfilledFn = value => {
        try {
          // 执行第一个(当前的)Promise的成功回调,并获取返回值
          let x = resolveFn(value)
          // 分类讨论返回值,如果是Promise,那么等待Promise状态变更,否则直接resolve
          x instanceof MyPromise ? x.then(resolve, reject) : resolve(x)
        } catch (error) {
          reject(error)
        }
      }
  
      // reject同理
      const rejectedFn  = error => {
        try {
          let x = rejectFn(error)
          x instanceof MyPromise ? x.then(resolve, reject) : resolve(x)
        } catch (error) {
          reject(error)
        }
      }
  
      switch (this._status) {
        // 当状态为pending时,把then回调push进resolve/reject执行队列,等待执行
        case PENDING:
          this._resolveQueue.push(fulfilledFn)
          this._rejectQueue.push(rejectedFn)
          break;
        // 当状态已经变为resolve/reject时,直接执行then回调
        case FULFILLED:
          fulfilledFn(this._value)    // this._value是上一个then回调return的值(见完整版代码)
          break;
        case REJECTED:
          rejectedFn(this._value)
          break;
      }
    })
  }

  //catch方法其实就是执行一下then的第二个回调
  catch(rejectFn) {
    return this.then(undefined, rejectFn)
  }

  //finally方法
  finally(callback) {
    return this.then(
      value => MyPromise.resolve(callback()).then(() => value),             //执行回调,并returnvalue传递给后面的then
      reason => MyPromise.resolve(callback()).then(() => { throw reason })  //reject同理
    )
  }

  //静态的resolve方法
  static resolve(value) {
    if(value instanceof MyPromise) return value //根据规范, 如果参数是Promise实例, 直接return这个实例
    return new MyPromise(resolve => resolve(value))
  }

  //静态的reject方法
  static reject(reason) {
    return new MyPromise((resolve, reject) => reject(reason))
  }

  //静态的all方法
  static all(promiseArr) {
    let index = 0
    let result = []
    return new MyPromise((resolve, reject) => {
      promiseArr.forEach((p, i) => {
        //Promise.resolve(p)用于处理传入值不为Promise的情况
        MyPromise.resolve(p).then(
          val => {
            index++
            result[i] = val
            if(index === promiseArr.length) {
              resolve(result)
            }
          },
          err => {
            reject(err)
          }
        )
      })
    })
  }

  //静态的race方法
  static race(promiseArr) {
    return new MyPromise((resolve, reject) => {
      //同时执行Promise,如果有一个Promise的状态发生改变,就变更新MyPromise的状态
      for (let p of promiseArr) {
        MyPromise.resolve(p).then(  //Promise.resolve(p)用于处理传入值不为Promise的情况
          value => {
            resolve(value)        //注意这个resolve是上边new MyPromise的
          },
          err => {
            reject(err)
          }
        )
      }
    })
  }
}


```

