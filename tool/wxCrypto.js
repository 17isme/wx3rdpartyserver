let WXBizMsgCrypt = require('wechat-crypto');
let wxCrypto = new WXBizMsgCrypt('消息校验Token', '消息加解密Key',"APPID");

module.exports = wxCrypto;