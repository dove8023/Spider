const superagent = require("superagent");
const cheerio    = require("cheerio");
const eventproxy = require("eventproxy");
const DB         = require("./setup");
const redis      = require("redis");

let client = redis.createClient(6379 , "localhost" , {});
let Reg = /\w+\.ifeng\.\w+/i;
let Result  = [];
let n = 0;

function GetHttp (href , ep){
    superagent.get(href).end((err , res)=>{
        ep.emit("getOver" , [href]);
        n++;
        console.log(href , n);
        if(err || !res || !res.text){
            console.log("something error");
            return;
        }
        let $ = cheerio.load(res.text);
        let aE= $("a");

        for(let i=0,len=aE.length;i<len;i++){
            let Href = aE.eq(i).attr("href");
            let Text = aE.eq(i).text();
            if(Reg.test(Href)){
                if(Href.length > 150){
                    Href = Href.substr(0 , 150);
                }
                if(Text.length > 150){
                    Text = Text.substr(0 , 150);
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
            }
        }
    });
}


function GetHrefs(){
    let ep = new eventproxy();
    ep.after("getOver" , 40 , function(result){
        console.log("over");
        ep = null;
        //一次请求结束
        setTimeout(GetHrefs , 5000);
    });
    RedisListE.getList(40 , function(result){
        if(result.length == 0){
            return;
        }

        result.forEach(function(oneHref){
            if(!oneHref){
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


function RedisList(){
    this.client = client;
    this.addList("http://www.ifeng.com");
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

var RedisListE = new RedisList();

GetHrefs();

SaveHrefs();

