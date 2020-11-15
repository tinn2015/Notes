# change

### 1. Vue全局的修改
```javascript
//  Vue全局api
Vue.component()
Vue.use()
Vue.mixin()
Vue.directive()
```
vue2上存在的问题是：

1. 从同一Vue构造函数创建的每个根实例都共享相同的全局配置。 导致同一个页面上的两个实例，难以分别配置

2.  对测试不友好, 测试需要在每次测试后将测试用例还原，以免污染其他测试案例

**vue3.0  createApp**
```javascript
//  2.0 上的全局配置， 实际上没有app的概念

//  3.0上的新概念
import { createApp } from 'vue'

const app = createApp({})
```
2x Global API | 3x Instance API
:-|-|-
Vue.config | app.config
Vue.config.productionTip | removed
Vue.config.ignoredElements | app.config.isCustomElement
Vue.component | app.component
Vue.directive | 	app.directive
Vue.mixin | 	app.mixin

**最大的变化就是抽象出app的概念。将之前的Vue全局字面量的配置，修改为一个app实例的配置。这样可以做到更配置灵活， 另外这些全局方法只能通过es6的模块化引入， 拥有更好的treeSharking**

- Vue.config.productionTip 配置被移除  

  这是一个启动生产提示， 设为true时会多一条'you are running Vue in development mode' 的提示。在3.0中这个提示 仅在'dev + full build'时存在，并且现在的单页应用在绝大多数情况下脚手架都正确配置了环境， 所以移除。

- config.ignoredElements -> config.isCustomElement
```javascript
// before
Vue.config.ignoredElements = ['my-el', /^ion-/]

// after
const app = Vue.createApp({})
app.config.isCustomElement = tag => tag.startsWith('ion-')
```  

这个配置的作用是告诉vue,这是一个自定义元素而不是组件。3.0中用一个方法取代正则， 更具有灵活性。

- 插件如何安装

```JAVASCRIPT
//  2.0 是window.vue.use(VueRouter)

const app = createApp(MyApp)
app.use(VueRouter)
```

- 如何挂载vue, 创建vue组件， 自定义指令
```javascript
const app = createApp(MyApp)

app.component('button-counter', {
  data: () => ({
    count: 0
  }),
  template: '<button @click="count++">Clicked {{ count }} times.</button>'
})

app.directive('focus', {
  mounted: el => el.focus()
})

// now every application instance mounted with app.mount(), along with its
// component tree, will have the same “button-counter” component
// and “focus” directive without polluting the global environment
app.mount('#app')
```

- provide/inject
```javascript
// in the entry
app.provide('guide', 'Vue 3 Guide')

// in a child component
export default {
  inject: {
    book: {
      from: 'guide'
    }
  },
  template: `<div>{{ book }}</div>`
}
```
provide 依赖后其子组件可随意inject

- 不同实例间共享配置  
v-focus将在Foo和Bar组件以及其后代可得

```javascript
import { createApp } from 'vue'
import Foo from './Foo.vue'
import Bar from './Bar.vue'

const createMyApp = options => {
  const app = createApp(options)
  app.directive('focus' /* ... */)

  return app
}

createMyApp(Foo).mount('#foo')
createMyApp(Bar).mount('#bar')
```

### 2. vue 3.0 更好的treeSharking
3.0 中的api 都面向treeSharking重新组值，3.0api 只能按模块化方式引入， 这样没有使用的模块将不会打入bundle。

以下api受到影响：
- Vue.nextTick
- Vue.observable (replaced by Vue.reactive)
- Vue.version
- Vue.compile (only in full builds)
- Vue.set (only in compat builds)
- Vue.delete (only in compat builds)

```javascript
// 也就是说这些api 只能通过模块化导入
import { nextTick } from 'vue'

import { h, Transition, withDirectives, vShow } from 'vue'
```

### 3. Inline Template不再支持

```javascript
// 跟solt差不多， 使用my-component中的模板来渲染， 分布式渲染。
<my-component inline-template>
  <div>
    <p>These are compiled as the component's own template.</p>
    <p>Not parent's transclusion content.</p>
  </div>
</my-component>
```

在3.0中可以使用solt 或者 通过id绑定template。

### 4. key
- 3.0中 v-if/v-else/v-else-if 不用添加key, vue内部会自动生成key
- \<template v-for> key应该绑定在template上， 而不是其children上
- virtual-dom pacth 的时候key 作为节点的表示， vue通过key来复用和重新对节点编号。要是没有key,vue将重新执行diff算法， 所以key 是diff 的优化策略

### 5. KeyCode Modifiers
由于web标准中KeyboardEvent.keyCode被废弃。在vue2.0中以下形式将不在支持。
```javascript
<input v-on:keyup.13="submit" />

Vue.config.keyCodes = {
  f1: 112
}

<input v-on:keyup.f1="showHelpText" />
```

vue3.0
```javascript
<!-- Vue 3 Key Modifier on v-on -->
<input v-on:keyup.delete="confirmDelete" />
```

### 6. 设置props 的默认值
```javascript
import { inject } from 'vue'

export default {
  props: {
    theme: {
      default (props) {
        // `props` is the raw values passed to the component,
        // before any type / default coercions
        // can also use `inject` to access injected properties
        return inject('theme', 'default-theme')
      }
    }
  }
}
```

### 7. render

### 8. slot

### 9. Transition Class Change
- Replace instances of .v-enter to .v-enter-from
- Replace instances of .v-leave to .v-leave-from

### 10. v-model

- 组件的v-model 由之前的value 改为  modelValue
- v-bind.sync 修饰符 改为 v-model:title="pageTitle"
- 现在v-model 可以同时绑定多个值
- 现在可以自定义v-model 修饰符

```javascript
// vue2.0 组件上的v-model 是v-bind:value  v-on:input 的语法糖
// 绑定值value 和 事件input是不可改变的
<ChildComponent v-model="pageTitle" />

// would be shorthand for

<ChildComponent :value="pageTitle" @input="pageTitle = $event" />
```

```javascript
// 在vue 2.2 以后新增加了model选项用以之前v-model语法糖绑定值和绑定事件的修改

//  这有个缺点就是只能单个组件的修改， 无法批量

//  以下将value -> checked, input -> change
Vue.component('my-checkbox', {
  model: {
    prop: 'checked',
    event: 'change'
  },
  props: {
    // this allows using the `value` prop for a different purpose
    value: String,
    // use `checked` as the prop which take the place of `value`
    checked: {
      type: Number,
      default: 0
    }
  },
  // ...
})
```

```javascript
// 在vue3.0 上是默认是绑定在modelValue字段上
// 
<ChildComponent v-model="pageTitle" />

// <!-- would be shorthand for: -->

<ChildComponent
  :modelValue="pageTitle"
  @update:modelValue="pageTitle = $event"
/>

// 如果加上title参数，那么就绑定在title上

<ChildComponent v-model:title="pageTitle" />

<ChildComponent :title="pageTitle" @update:title="pageTitle = $event" />

// 绑定多个值
<ChildComponent v-model:title="pageTitle" v-model:content="pageContent" />

<ChildComponent
  :title="pageTitle"
  @update:title="pageTitle = $event"
  :content="pageContent"
  @update:content="pageContent = $event"
/>

// 允许自定义修饰符
<ChildComponent v-model.capitalize="pageTitle" />
```
![v-model](./v-bind-instead-of-sync.png)


```javascript
<ChildComponent v-model="pageTitle" />

// ChildComponent.vue

export default {
  props: {
    modelValue: String // previously was `value: String`
  },
  methods: {
    changePageTitle(title) {
      this.$emit('update:modelValue', title) // previously was `this.$emit('input', title)`
    }
  }
}
```

### 11. v-if v-for
在2.0中 v-for 优先
在3.0中v-if 优先

推荐实现是， 声明一个computed来过滤掉不可见元素

### 12. v-bind 的绑定顺序会影响结果

```javascript
//  也就是说，后面声明的优先更高
<!-- template -->
<div id="red" v-bind="{ id: 'blue' }"></div>
<!-- result -->
<div id="blue"></div>

<!-- template -->
<div v-bind="{ id: 'blue' }" id="red"></div>
<!-- result -->
<div id="red"></div>
```

### 13. 响应式实现
主要就是Object.definedProperty() -> Proxy

**为了兼容, ie上仍然使用Object.definedProperty(), 但只是底层兼容， 上层api 是一致的**

```javascript
// 创建响应式object
// reactive 实际上就是 vue2上的 Vue.observable()
import { reactive } from 'vue'

// reactive state
const state = reactive({
  count: 0
})
```

```javascript
// 创建一个响应式的值， 用ref
//  这个api 的目的就是让开发者可以摆脱模板， 可以有更灵活的封装
// ref创建的响应式值通过.value 访问， 但是再template模板中会自动展开， 无需.value
//  ref创建的响应式值需要通过value访问的原因是： 在js 中基础类型是直接保存值得，无法做到拦截。对象、数组、map这些复杂类型保存得是引用。
<template>
  <div>
    <span>{{ count }}</span>
    <button @click="count ++">Increment count</button>
  </div>
</template>

<script>
  import { ref } from 'vue'
  export default {
    setup() {
      const count = ref(0)
      count.value++
      // log -> 1
      console.log(count.value)
      return {
        count
      }
    }
  }
</script>
```

```js
// reactive 创建的响应式对象是无法解构的
// 为了实现解构可以使用toRefs方法

import { reactive, toRefs } from 'vue'

const book = reactive({
  author: 'Vue Team',
  year: '2020',
  title: 'Vue 3 Guide',
  description: 'You are reading this book right now ;)',
  price: 'free'
})
/*没有解构功能 eg: let { author, title } = book */
let { author, title } = toRefs(book)

title.value = 'Vue 3 Detailed Guide' // we need to use .value as title is a ref now
console.log(book.title) // 'Vue 3 Detailed Guide'
```

### 14. watchEffect

```js
//  watchEffect 会自动收集依赖， 并在依赖发生变化时执行回调方法
const count = ref(0)

watchEffect(() => console.log(count.value))
// -> logs 0

setTimeout(() => {
  count.value++
  // -> logs 1
}, 100)
```
**与watch 和 computed的区别**
- watch是指定依赖，watchEffect是自动收集依赖（其实也就是添加了一个watcher类型）
- watch可以获取到新旧值， watchEffect只能拿到最新值
- computed主要计算一个依赖其他值来渲染的值， watchEffect倾向于依赖值变化之后的回调方法

**其他特性**
```js
// 可以手动停止监听
// watchEffect 是在 setup 或者 生命周期里面注册的话，在组件取消挂载的时候会自动的停止掉
const stop = watchEffect(() => {
  /* ... */
})

// later
stop()
```

```js
// watchEffect 会暴露onInvalidate方法
// 该方法可以做到再依赖值变化， 或者watcher都执行完再执行
// 这就是为了watcher重复修改依赖值，导致很多无效的操作。
// 会在页面更新之前调用
watchEffect(onInvalidate => {
  const token = performAsyncOperation(id.value)
  onInvalidate(() => {
    // id has changed or watcher is stopped.
    // invalidate previously pending async operation
    token.cancel()
  })
})
```

```javascript
//  onTrack 和 onTrigger 可以用来debug依赖的watcher
watchEffect(
  () => {
    /* side effect */
  },
  onTrack  (e) {
    debugger
  },
  {
    onTrigger(e) {
      debugger
    }
  }
)
```

## Composition Api
----

目的只有一个： 脱离模板让业务逻辑更加灵活

mixins 的缺点：
- 可能会产生命名冲突， 难以维护
- 无法传参， 灵活性不够好。
其实问题就在mixins 还是面向模板， 我们期望的是面向函数。


### 1. setUp
- 再组件created 之前执行， composition api 的入口
- setUp执行的在组件created 之前， 所以setUp 中没有this, 无法访问组件中申明的state、computed、methods
- setUp 中生命周期hook： onBeforeMount、onMounted、onBeforeUpdate、onUpdated、onBeforeUnmount、onUnmounted、onErrorCaptured、onRenderTracked、onRenderTriggered

```js
//  setUp 接受两个参数
// 注意setUp 中得this 指向作用域， 不再指向vue 实例
setup(props, context) {
  // props 注意无法解构获取
  console.log(props.title)
  // Attributes (Non-reactive object)
  console.log(context.attrs)

  // Slots (Non-reactive object)
  console.log(context.slots)

  // Emit Events (Method)
  console.log(context.emit)
}
```

```js
// 示例
<template>
  <div>{{ collectionName }}: {{ readersNumber }} {{ book.title }}</div>
</template>

<script>
  import { ref, reactive } from 'vue'

  export default {
    props: {
      collectionName: String
    },
    setup(props) {
      const readersNumber = ref(0)
      const book = reactive({ title: 'Vue 3 Guide' })

      // expose to template
      return {
        readersNumber,
        book
      }
    }
  }
</script>
```





问题？

1. 改为proxy, get得时候track?, set 的时候 trigger?, Reflect 的作用是什么？