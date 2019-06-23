import Sequelize from 'sequelize'

const {
  IMI_DB_SCHEMA,
  IMI_DB_USER,
  IMI_DB_PASSWORD,
  IMI_DB_HOST
} = process.env

export const dbCfg = {
  schema: IMI_DB_SCHEMA || 'imi',
  user: IMI_DB_USER || 'root',
  password: IMI_DB_PASSWORD || 'root',
  options: {
    host: IMI_DB_HOST || 'localhost',
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

const {
  IMI_REDIS_HOST,
  IMI_REDIS_PORT,
  IMI_REDIS_PASSWORD
} = process.env
export const redisConfig = {
  host: IMI_REDIS_HOST || '127.0.0.1',
  port: IMI_REDIS_PORT || 6379,
  password: IMI_REDIS_PASSWORD || ''
}

const {
  IMI_MINI_APPID,
  IMI_MINI_SECRET
} = process.env
export const wxMiniConfig = {
  appid: IMI_MINI_APPID || 'wx2eb5dc08f275c26c',
  secret: IMI_MINI_SECRET || '04f62fca05307276cd9fe937ef85065c'
}

const {
  IMI_CATEGORY,
  IMI_PORT
} = process.env
// winston 日志系统的category
export const category = IMI_CATEGORY || 'logImi'

export const PORT = IMI_PORT || 8001

// 是否在输出错误信息到日志文件或者控制台
export const isOutputErrorLog = true

export const HOST = process.env.HOST || 'http'