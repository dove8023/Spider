const superagent = require("superagent");
const cheerio    = require("cheerio");
const eventproxy = require("eventproxy");
const DB         = require("./setup");
const redis      = require("redis");
const headers = {
    origin: 'baidu.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2725.0 Safari/537.36'
}
let client = redis.createClient(6379 , "localhost" , {});
let Reg = /itbilu|^\//i;
let Reg2 = /^\//i;
let Result  = [];
let n = 0;

function GetHttp (href , ep){
    console.log("just go GetHttp" , href);
    superagent.get(href).set("User-Agent" , headers["User-Agent"]).end((err , res)=>{
        ep.emit("getOver" , [href]);
        n++;
        console.log(href , n);
        if(err || !res || !res.text){
            console.log("something error");
            return;
        }
        let $ = cheerio.load(res.text);
        let aE= $("a");
        console.log("this links a: " , aE.length);
        for(let i=0,len=aE.length;i<len;i++){
            let Href = aE.eq(i).attr("href");
            let Text = aE.eq(i).text();
            // console.log("this Href:" , Href);
            if(Reg.test(Href)){
                if(Href.length > 150){
                    Href = Href.substr(0 , 150);
                }
                if(Text.length > 150){
                    Text = Text.substr(0 , 150);
                }
                if(Reg2.test(Href)){
                    Href = "http://itbilu.com"+Href;
                }
                client.get(Href , (err , data)=>{
                    if(data) return;
                    client.set(Href , true);
                    Result.push({
                        "href" : Href,
                        "text" : Text,
                        "number": n
                    });
                    RedisListE.addList(Href);
                    $ = null;
                    aE = null;
                });
            }else{
                console.log("not match" , Href);
            }
        }
    });
}

let Over = 0; //等待请求队列如果3次获取为0，则代表基于当前正则匹配请求结束
function GetHrefs(){
    let ep = new eventproxy();
    ep.after("getOver" , 40 , function(result){
        console.log("over");
        ep = null;
        //一次请求结束
        setTimeout(GetHrefs , 5000);
    });
    RedisListE.getList(40 , function(result){
        console.log(result)
        result.forEach(function(oneHref){
            if(!oneHref){
                if(oneHref == null){
                    Over++;
                    if(Over >= 100){
                        GetOver();
                    }
                }
                ep.emit("getOver" , [oneHref]);
                return; 
            }
            GetHttp(oneHref , ep);
        });
    });
}

function SaveHrefs(){
    let results = [];
    if(Result.length == 0){
        return setTimeout(SaveHrefs , 20000);
    }else{
        results = Result.splice(0,1000);
    }
    if(results.length == 0){
        return setTimeout(SaveHrefs , 20000);
    }
    DB.Alink.bulkCreate(results).then(function(data){
        console.log("插入数据条数: ",data.length);
        console.log("等待插入数据: ",Result.length);
        return SaveHrefs();
    });
}

function GetOver(){
    RedisListE.removeAll();
    if(Result.length != 0){
        SaveHrefs();
        setTimeout(function(){
            console.log("基于当前正则匹配请求结束");
            console.log("总共发起请求 : " , n);
            process.exit();
        } , 3000);
    }else{
        console.log("基于当前正则匹配请求结束");
        console.log("总共发起请求 : " , n);
        process.exit();
    }
}



function RedisList(){
    this.client = client;
}

RedisList.prototype.getList = function(num , callback) {
    let ep = new eventproxy();
    for(let i=0;i<num;i++){
        this.client.lpop("Cache" , (err , result)=>{
            ep.emit("CacheGet" , result);
        });
    }
    ep.after("CacheGet" , num , function(result){
        ep = null;
        return callback && callback(result);
    });
};

RedisList.prototype.addList = function(item) {
    this.client.lpush("Cache" , item);
};

RedisList.prototype.removeAll = function(){
    this.client.flushall();
}

var RedisListE = new RedisList();

RedisListE.addList("http://itbilu.com/");

GetHrefs();

SaveHrefs();

