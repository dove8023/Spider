/*
 * 创建数据库，建立连接
*/


var Sequelize = require("sequelize"),
	config    = require("./config");

var sequelize = new Sequelize(config.database , config.user , config.password , { "host":config.host , "port":config.port , "timezone":config.timezone , logging:false } , function(){
	console.log("mysql connect");
});


/* Users table */
var Alink = sequelize.define("takeGood" , {
	"text" : { type: Sequelize.STRING , allowNull : false },
	"href" : { type: Sequelize.STRING , allowNull : false },
    "number" : { type : Sequelize.INTEGER }
});

sequelize.sync({force:true});
// sequelize.sync();


module.exports = {
	"Alink" : Alink
}




