[vue-composition-api-rfc](https://vue-composition-api-rfc.netlify.app/zh/)

# 总结
1. vue2 中主要是基于模板的语法，这导致复杂组件阅读成本和维护成本非常大（例如申明的data和computed距离与之相关的业务逻辑可能有100行代码，复杂组件就显得非常凌乱。）

2. composition-api（组合api）中将创建响应式和computed等都封装成了直接可用的方法， 这使得我们可以将每一块逻辑封装起来， 在setup()方法中调度执行，以达到更友好的阅读， 和业务分装。我们可以通过setup()函数看出这个组件尝试做什么。

3. 更好的逻辑复用

# 相比mixin

- 渲染上下文中暴露的 property 来源不清晰。例如在阅读一个运用了多个 mixin 的模板时，很难看出某个 property 是从哪一个 mixin 中注入的。

- 命名空间冲突。Mixin 之间的 property 和方法可能有冲突，同时高阶组件也可能和预期的 prop 有命名冲突。

- 性能方面，高阶组件和无渲染组件需要额外的有状态的组件实例，从而使得性能有所损耗。

# REF

ref存在的目的是为了让基础类型具有响应式属性。要是都用reactive的话这个对象不能被解构或者展开

```javascript
// 这些方法直接可用， 拜托vue2.0选项模板
import { reactive, computed, watchEffect, onMounted } from 'vue'
```