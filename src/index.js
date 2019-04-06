/**
 * 读取配置 启动服务
 */
require('babel-register')
require('babel-polyfill')

const { init } = require('./lib/logs/init')
const { redisConfig, category } = require('./config')

init(redisConfig, category)

const server = require('./httpServer')

server.run().then(() => console.log('start running...'))
