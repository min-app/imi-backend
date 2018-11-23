const winston = require('winston')
require('winston-redis').Redis

/**
 * 高版本redis有问题，暂时使用winston2.4.4 https://github.com/winstonjs/winston/tree/2.x
 * 配置好日志写入方式，全局有效
 * @param {Object} redisConfig
 * @param {String} category
 */
export const init = (redisConfig, category) => {
  const options = process.env.NODE_ENV === 'production' ? {
    redis: {
      level: 'silly',
      host: redisConfig.host || '127.0.0.1',
      port: redisConfig.port || 6379,
      auth: redisConfig.password || '',
      length: 10000,
      container: category
    }
  } : {
    console: {
      level: 'silly',
      colorize: true,
      label: `category ${category}`
    }
  }
  winston.loggers.add(category, options)
}
