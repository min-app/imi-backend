/**
 * 开启定时任务
 */
require('babel-register')
require('babel-polyfill')

const server = require('./scheduleServer')

server.run().then(() => console.log('schedule process', process.pid))
