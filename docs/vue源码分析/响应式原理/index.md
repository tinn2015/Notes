# 响应式原理 Observe

## 问题
1. Watcher、Dep、Observe 分别是什么？ 三者是什么关系？
2. 如何实现响应式？

## 一 vue 初始化流程
![生命周期](./imgs/lifecycle.png)

vue 入口函数

``` javascript

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}
/* 事件， data初始化 */
initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
```
这是vue的构造函数，这些mixin方法主要是往Vue.prototype上挂载属性和方法，这里主要关注initMixin 方法。

```javascript
export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    /* vm指向构造函数Vue this */
    const vm: Component = this
    // a uid
    vm._uid = uid++

    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to avoid this being observed
    vm._isVue = true
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.

      /* _isComponent 区分是根组件还是内部组件 */
      initInternalComponent(vm, options)
    } else {
      /* 根组件 */
      /* mergeOptions 将组件中的模板语法参数 挂载到$options 上 */
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    /* 在vm 上挂载 $root $parent $children $refs _watcher _inactive _directInactive _isMounted _isDestroyed _isBeingDestroyed 属性*/
    initLifecycle(vm)
    initEvents(vm)
    /* 记录vnode 位置等，渲染的上下文 */
    initRender(vm)
    callHook(vm, 'beforeCreate')
    /* 实现 provide 和 inject 功能 */
    initInjections(vm) // resolve injections before data/props
    /* 初始化props, watches, methods, initData() */
    initState(vm)
    /* 实现 provide 和 inject 功能 */
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}
```

这里可以看到主要是在初始化生命周期、事件，callHook能发现### **生命周期就是组件在各个状态下的回调函数**。
我们关注点在initState()方法， 注意vm.$mount也是在这里执行的（mount的后面再说）

```javascript
export function initState (vm: Component) {
  vm._watchers = []
  const opts = vm.$options
  if (opts.props) initProps(vm, opts.props)
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  if (opts.computed) initComputed(vm, opts.computed)
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}
```
接着进入initData

```javascript
function initData (vm: Component) {
  let data = vm.$options.data
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  if (!isPlainObject(data)) {
    data = {}
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }
  // proxy data on instance
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  /* while循环效率优于 for等，数量越大越明显 */
  while (i--) {
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(key)) {
      proxy(vm, `_data`, key)
    }
  }
  // observe data
  observe(data, true /* asRootData */)
}
```
vue初始化流程
``` mermaid
graph LR

  initMixin --> initState --> initData --> observe --> walk --> defineReactive
```

从这里开始 将data 变为响应式数据

## 二 创建响应式数据

```javascript
export function observe (value: any, asRootData: ?boolean): Observer | void {
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  /* __ob__ 表示数据已经是响应式了 */
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}
```
oberve 就是Observer 类的实例

```javascript
/* 将数据拦截，get 触发收集依赖， set出发 更新dom， dep.notify -> watcher.update */
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    /* vue.__ob__ 指向Observer的this */
    /* 拦截__ob__属性 */
    debugger
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      /* 是否有__proto__属性 */
      /* 通过重写数组方法实现，实现对数组的拦截， 有局限性比如通过下标改变数据 */
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }
```
首先在这个类中我们第一次看到 Dep类, dep实例是Observe类的一个属性。
其次看下面连个方法。
copyAugment主要是对数组方法splice, push,shift, pop进行重写以达到监听拦截的目的。这样做的缺陷就是无法监听到通过下标的修改。

```javascript
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]
```
walk主要是循环object属性对其监听拦截。

``` javascript
walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }
```

```javascript
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  const dep = new Dep()
  /* 属性描述符 */
  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  /* 在obj 本身设置了get,set得时候，优先获取原来的getter、setter */
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  /* 如果value还是object, 那就循环调用observe */
  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      if (Dep.target) {
        /* 调用dep.target指向的 watcher的addDep 加入依赖 */
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      childOb = !shallow && observe(newVal)
      /* 遍历watcher 执行update 方法 */
      dep.notify()
    }
  })
}
```
![observe的过程](./imgs/observer.png)

这是观察者的核心方法， 通过Object.defineProperty方法对data的每一个属性进行拦截，在get是时候收集依赖，set的时候更新视图。
因为Object.defineProperty只能拦截对象的属性，这也是vue3.0 将拦截方式改为 [proxy](https://es6.ruanyifeng.com/#docs/proxy) 的原因之一。
看到这里可以发现收集依赖和触发更新都是通过dep 类实现得。

## 三 什么是收集依赖
收集依赖，其实就是收集watcher。这里要先介绍Watcher 类， 我们回到页面初始化方法initMixin(), 这个方法最后 vm.$mount(vm.$options.el)

```javascript
// public mount method
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}

```

在/src/platforms/web/runtime/index.js 中找到 $mount 定义的地方， 进入mountComponent

```javascript
export function mountComponent (
  vm: Component,
  el: ?Element,
  hydrating?: boolean
): Component {
  vm.$el = el
  if (!vm.$options.render) {
    vm.$options.render = createEmptyVNode
  }
  callHook(vm, 'beforeMount')

  let updateComponent
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    updateComponent = () => {
      const name = vm._name
      const id = vm._uid
      const startTag = `vue-perf-start:${id}`
      const endTag = `vue-perf-end:${id}`

      mark(startTag)
      const vnode = vm._render()
      mark(endTag)
      measure(`vue ${name} render`, startTag, endTag)

      mark(startTag)
      vm._update(vnode, hydrating)
      mark(endTag)
      measure(`vue ${name} patch`, startTag, endTag)
    }
  } else {
    updateComponent = () => {
      vm._update(vm._render(), hydrating)
    }
  }

  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child
  // component's mounted hook), which relies on vm._watcher being already defined

  // 这是一个render-watcher
  new Watcher(vm, updateComponent, noop, {
    before () {
      if (vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'beforeUpdate')
      }
    }
  }, true /* isRenderWatcher */)
  hydrating = false

  // manually mounted instance, call mounted on self
  // mounted is called for render-created child components in its inserted hook
  if (vm.$vnode == null) {
    vm._isMounted = true
    callHook(vm, 'mounted')
  }
  return vm
}
```
我们进入Watcher类

```javascript
export default class Watcher {
  vm: Component;
  expression: string;
  cb: Function;
  id: number;
  deep: boolean;
  user: boolean;
  lazy: boolean;
  sync: boolean;
  dirty: boolean;
  active: boolean;
  deps: Array<Dep>;
  newDeps: Array<Dep>;
  depIds: SimpleSet;
  newDepIds: SimpleSet;
  before: ?Function;
  getter: Function;
  value: any;

  constructor (
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean
  ) {
    this.vm = vm
    /* 这是一个渲染watcher, 根据不同场景会实例出多种watcher, Watcher 相当于一个watcher工厂 */
    if (isRenderWatcher) {
      vm._watcher = this
    }
    // 一个watcher队列
    vm._watchers.push(this)
    // options
    if (options) {
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
      this.before = options.before
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }
    this.cb = cb
    this.id = ++uid // uid for batching
    this.active = true
    this.dirty = this.lazy // for lazy watchers
    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.expression = process.env.NODE_ENV !== 'production'
      ? expOrFn.toString()
      : ''
    // parse expression for getter
    // 传入得方法就是watcher中得 getter
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
      if (!this.getter) {
        this.getter = noop
        process.env.NODE_ENV !== 'production' && warn(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        )
      }
    }
    // 如果设置了lazy， 那么第一次不会进行取值计算 
    /* 当 initComputed 和 initWatch 的时候this.lazy = true */
    /* 在 mountComponent 中 this.lazy 为 false, 执行this.get() 更新 */
    this.value = this.lazy
      ? undefined
      : this.get()
  }

  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  get () {
    pushTarget(this)
    let value
    const vm = this.vm
    try {
      /* 这里直接更新视图 */
      value = this.getter.call(vm, vm)
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`)
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      if (this.deep) {
        traverse(value)
      }
      popTarget()
      this.cleanupDeps()
    }
    return value
  }

  /**
   * Add a dependency to this directive.
   */

  /* 这个方法就是触发依赖收集 */
  addDep (dep: Dep) {
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        dep.addSub(this)
      }
    }
  }

  /**
   * Clean up for dependency collection.
   */
  cleanupDeps () {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }

  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  update () {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true
    } else if (this.sync) {
      this.run()
    } else {
      queueWatcher(this)
    }
  }

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  run () {
    if (this.active) {
      const value = this.get()
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) ||
        this.deep
      ) {
        // set new value
        const oldValue = this.value
        this.value = value
        if (this.user) {
          try {
            this.cb.call(this.vm, value, oldValue)
          } catch (e) {
            handleError(e, this.vm, `callback for watcher "${this.expression}"`)
          }
        } else {
          this.cb.call(this.vm, value, oldValue)
        }
      }
    }
  }

  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */
  evaluate () {
    this.value = this.get()
    this.dirty = false
  }

  /**
   * Depend on all deps collected by this watcher.
   */
  depend () {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }

  /**
   * Remove self from all dependencies' subscriber list.
   */
  teardown () {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this)
      }
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      this.active = false
    }
  }
}
```
这里我们主要关注watcher 中的get() 和 addDep() 方法实现收集逻辑。
get()方法中pushTarget, 我们进入看一下这块的逻辑。

```javascript

/* 5.29 tinn */
```

当前我们实例的是renderWatcher, 除此之外还有 user-watcher, computed-watcher

```javascript
// user-watcher
new Vue({
  data {
    msg: 'hello Vue!'
  }
  created() {
    this.$watch('msg', cb())  // 定义用户watcher
  },
  watch: {
    msg() {...}  // 定义用户watcher
  }
})

```

```javascript
// computed-watcher
new Vue({
  data: {
    msg: 'hello'  
  },
  computed() {
    sayHi() {  // 计算watcher
      return this.msg + 'vue!'
    }
  }
})

```
所以在vue中有四种方式创建watcher, 这里说的时render-watcher, 其余的不做拓展。
1. render
2. computed
3. watch
4. vm.$watch


## 四 如何收集依赖 Dep

![响应式](./imgs/watch.png)

```javascript
export default class Dep {
  /* target 就是 watcher */
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor () {
    this.id = uid++
    /* 这是一个watcher 队列 */
    this.subs = []
  }

  addSub (sub: Watcher) {
    this.subs.push(sub)
  }

  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }

  depend () {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  notify () {
    // stabilize the subscriber list first
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      /* */
      subs.sort((a, b) => a.id - b.id)
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

  // The current target watcher being evaluated.
  // This is globally unique because only one watcher
  // can be evaluated at a time.
  /* 同时只能有一个watcher执行 */

  /* 只有两种这两种方法可以改变 Dep.target */
  Dep.target = null
  const targetStack = []

  export function pushTarget (target: ?Watcher) {
    targetStack.push(target)
    Dep.target = target
  }

  export function popTarget () {
    targetStack.pop()
    Dep.target = targetStack[targetStack.length - 1]
  }
```

Dep 是整个响应式中介， 他连接着 watcher 和 observe 的桥梁



## 五 更新试图

vue 主要是三个阶段， 初始化阶段， 依赖收集阶段， 响应阶段

## 六 下期预告（diff）

## 流程图

## 参考
[你不知道的Vue响应式原理](https://juejin.im/post/5a734b6cf265da4e70719386)

主要说明 Watcher、Dep、Observe 之间的关系

vue 父子组件生民周期的顺序是什么？