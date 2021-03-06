# http缓存机制

<span style="color: #ea4335; font-size: 20px">http缓存主要分为强缓存和协商缓存</span>

## 强缓存

对于强缓存， 服务器返回的响应头header中会有两个字段来表明：Expires和Cache-Control

### Expires

expires是指到期时间，当发起请求的时间小于expires时间，那么久直接使用缓存中得数据。

但是由于本地时间跟服务器时间可能存在误差， 所以结果可能不准确。

另外Expires是Http1.0的产物，现在基本被Cache-Control取代。

### Cache-Control

Cache-Control 有多种属性

1. max-age: max-age = t, 这是指缓存时长，缓存将在t秒后失效，有效避免服务器于客户端时间不同步问题。

2. no-cache: 不使用强缓存， 需要使用协商缓存

3. no-store: 所有内容不缓存

4. private: 客户端可以缓存

5. public: 客户端和代理服务器都可以缓存

<span style="color: #ea4335; font-size: 16px">Expires和Cache-Control 同时存在， Cache-Control 优先级跟高</span>

## 协商缓存

第一次请求时服务器会将一个缓存标识返回到客户端， 再次请求时客户端会将这个标识带给服务端。服务端根据该标识判断是否使用缓存。如果使用缓存，返回状态码304， 浏览器读取到304后直接使用本地缓存。

主要有两种缓存标识

1. Last-Modified
服务器在响应请求的时候，会告诉浏览器资源最后修改时间。

当浏览器再次请求得时候请求头会有个if-Modified-Since字段，将最后修改时间告知服务器。服务器去对比资源最后修改时间，如果没有修改，则返回304。如果被修改了则返回 200 Ok

2. Etag

在服务器上，一个资源被修改了，但可能其内容根本没有改变， 这时也会返回200 导致浏览器请求了一个一模一样的资源，造成资源浪费， 这时Etag会是一种更好的方式

Etag是Http1.1 推出的

Etag是服务器通过一定算法实现的文件标识

同样的服务器会对比该标识根据结果返回200 OK 和 304

<span style="color: #ea4335; font-size: 16px">实际应用中由于Etag的计算是使用算法来得出的，而算法会占用服务端计算的资源，所有服务端的资源都是宝贵的，所以就很少使用Etag了。</span>

<span style="color: #ea4335; font-size: 16px">Etag优先级高于LastModified</span>

## 重点
- 两类缓存机制可以同时存在，强制缓存的优先级高于协商缓存，当执行强制缓存时，如若缓存命中，则直接使用缓存数据库数据，不在进行缓存协商。