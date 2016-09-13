# Spider
爬取某一网站的所有链接

## 要求
    启动redis，mysql服务
    config.json为mysql的配置文件


爬虫理解：简单的说就是服务端访问其它网站，拿到请求结果，做些处理，然后继续访问其它网站。
实现方案：superagent用于发起请求，cheerio拿到结果后类似于jquery的DOM操作来处理结果，eventproxy总不能一个接一个的来吧，得并发提高效率。
其它      ：缓存数据量很大需要redis来帮忙，收集的数据需要mysql来存储（这里用sequelize）。
程序：
let AllHref = [];      //保存已经访问过的连接，不要重复着来    ---->放入redis中
let Result = [];      //将整理的结果保存到这里
let Cache = [];      //等待请求的列表    ---------->放入redis中

GetHttp (href , ep) 函数，使用superagent用传入的href发起请求，然后处理界面，拿到页面中所有的a连接；正则判断是当前网站，就考虑是否保存。

GetHrefs();   从缓存中拿到将要进行请求的链接，调用GetHttp，每一波请求结束后等待5s开始下一波

SaveHrefs(); 每隔一段时间从Result中截取一些数据存入数据库中。

其它，RedisList()操作redis的列