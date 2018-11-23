import Sequelize from 'sequelize'

// 网关地址 
export const gatewayUrl = 'http://127.0.0.1:9527/graphql'

export const dbCfg = {
  schema: 'gqlRemote',
  user: 'root',
  password: '123456', // 123456' 
  options: {
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4'
    },
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    },
    define: {
      underscored: true,
      underscoredAll: true
    },
    logging: false,
    benchmark: true,
    operatorsAliases: Sequelize.Op
  }
}

export const redisConfig = {
  host: process.env.RedisServer || 'localhost',
  port: 6379,
  password: ''
}

// winston 日志系统的category 
export const category = 'logAssemble'

export const PORT = 9529

// 诊所公众号 
export const wechatConfig = {
  // 罗乔测试号 
  appID: 'wxcba6fe008743c8c6',
  appSecret: '052c63bd44fe0814733b52a28d28b3c7',
  encodingAESKey: 'YtxVQ0jhh8IOUArpa1srHq9xtnSaWdeaNiwdl9hh9si',
  token: '68687680e84c2d789a04974e7e7ffb44'
}

// 支付配置 - 诊所 
export const wechatPayConfig = {
  appId: 'wx0e41e253238d0981',
  appSecret: '85c78b51fe44ccf488b88be4d84f9f8e',
  mchId: '1401571102',
  partnerKey: 'UmsU7ngCqXWs8nHUxMUzTvqRHUiwfBB6'
}

// 统一配置诊所微信JS支付回调地址, 其他信息在ClinicConfig内保存 
export const wechatClinicJsPay = {
  notifyUrl: 'http://dev.clinic.api.healthydeer.com/wechat/pay/notify',
  cert: './resource/wechat/apiclient_cert_zhensuo.p12'
}

export const hostConfig = {
  wechatServer: 'dev.clinic.api.healthydeer.com',
  wechatClient: 'dev.clinicwx.healthydeer.com',
  homeUrl: 'dev.clinicwx.healthydeer.com',
  famousDoctorApi: 'dev.doctor.api.healthydeer.com',
  clinicUrl: 'dev.clinic.healthydeer.com'
}

// 成都健康阿鹿药房授权字符串 
// export const wechatAuthorizeString = 'fhfCrhY92C5tAo3F' 

// 成都健康阿鹿诊所授权字符串, 测试环境 
export const wechatAuthorizeString = 'zLN3ayC5icxiTSMU'

// 是否在输出错误信息到日志文件或者控制台 
export const isOutputErrorLog = true

// 是否使用parse-error包格式化报错信息 
export const isParseError = false
