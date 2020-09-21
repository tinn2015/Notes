[hrm实现原理](https://segmentfault.com/a/1190000022485386)

[hrm实现原理2](https://zhuanlan.zhihu.com/p/30669007)

# 总结

**区别于页面刷新， HRM只会替换修改部分，保留页面原来的状态**
1. webpack-dev-server会向client运行时注入一端代码， 将client-server建立socket连接
2. node的文件系统监听文件变化
3. 文件发生变化后通知webpack重新编译
4. webpack编译过程中获取变化模块的hash, 通过socket 通知给client
```javascript
// 也就是一个mainfest.json 文件

// 会收到一个hot-update.json的文件
{
  c: {0: true, 2: true},
  h: "8cf3528406cc8d349557"
}
```

5. 浏览器接收到要更新模块的hash,会执行一个hotDownloadMainfest()方法，发送一个get请求来下载响应的模块， 对应的是hot-update.js并插入主文档

6. hot-update.js 插入成功后，执行hotAPI 的 createRecord 和 reload方法，获取到 Vue 组件的 render方法，重新 render 组件， 继而实现 UI 无刷新更新。