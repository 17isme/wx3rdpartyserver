// 公共变量
const AppID = "wx71206caa6c6c061f";
const AppSecret = "7d56c78ec200eba3aaf0961a94d2ffd4";
// 开启http服务
require('./wxHttp')(AppID,AppSecret);

// 开启同步器
require('./wxSync')(AppID,AppSecret);