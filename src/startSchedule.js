/**
 * 开启定时任务
 */
require('babel-register')
require('babel-polyfill')

const server = require('./scheduleServer')
let nodeEnv = process.env.NODE_ENV

function dumpError (err) {
  if (typeof err === 'object') {
    if (err.message) {
      console.log('\nMessage: ' + err.message)
    }
    if (err.stack) {
      console.log('\nStacktrace:')
      console.log('====================')
      console.log(err.stack)
    }
  } else {
    console.log('dumpError :: argument is not an object')
  }
}

global.assert = (ex, message) => {
  if (!ex) {
    try {
      throw new Error(message, 0xffff)
    } catch (err) {
      console.log(err)
      dumpError(err)
      if (nodeEnv === 'production') {
      } else {
        throw new Error(err.message)
      }
    }
  }
}

server.run().then(() => console.log('schedule process', process.pid))
