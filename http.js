/* 模拟请求 */

const superagent = require("superagent");
const headers = {
    origin: 'http://www.goodsinfo.cn/',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.987',
    "Cookie" : "session_id=s%3AZFZR60G3g6ipTzcEhuFm69e6JPqy_p3_.PZEB9zHaNcNdkPtXYQYJQAxY9rXEyQ8%2FMMW504wh5HE"
}
function Controller (req , res , next){

    let url = "http://www.goodsinfo.cn/api/type/list"; //request the url.


    //伪装成一个登录用户
    superagent.get(url).set("User-Agent" , headers["User-Agent"]).set("Cookie" , headers.Cookie).end((err , result)=>{
        
        if(err || !result || !result.text){
            console.log("something error");
            return;
        }

        //获取返回数据
        console.log(result.text);

        //这个时候处理从前端的请求，将结果返回出去
        // res.send(result.text);
        
    });
}

Controller();
module.exports = Controller;