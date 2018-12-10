import Sequelize from 'sequelize'

export const dbCfg = {
  schema: 'base',
  user: 'root',
  password: 'root', // 123456'
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
  host: '127.0.0.1',
  port: 6379,
  password: ''
}

// winston 日志系统的category
export const category = 'logBase'

export const PORT = 9520

// 是否在输出错误信息到日志文件或者控制台
export const isOutputErrorLog = true
