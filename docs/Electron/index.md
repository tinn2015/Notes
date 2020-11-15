[教程](https://www.w3cschool.cn/electronmanual/p9al1qkx.html)  
[原理入门](https://juejin.im/entry/5a4e02d5f265da432718a6fe)

# Electron介绍
在浏览器环境， 页面是运行在沙盒环境里的， 无法访问系统api。
Electron 使用 Chromium 来展示页面，允许网页可以与底层操作系统直接交互

# Electron 签名?

# 进程间通信
## 1. ipcMain
在主进程中接受渲染进程发过来的消息
```javascript
// main.js 主进程
ipcMain.on(method, fn)
```
## 2. ipcRender
这个是在渲染进程中用的， 负责接收主进程事件， 和发送事件到主进程

## 3. remote

通过remote 可以获取到主进程的一些对象

