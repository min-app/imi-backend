import winston from 'winston'
import errorStackParse from 'error-stack-parser'

import { category } from '../../config'
require('winston-redis').Redis

export const loggers = winston.loggers.get(category)

const log = {}

const _log = (msg, level = 'info', ext = {}) => {
  const data = {}
  // 追踪调用者，记录位置
  if (level === 'error') {
    let error = new Error()
    let index = 2
    if (msg instanceof Error) {
      error = msg
      index = 0
    }
    const stack = errorStackParse.parse(error)

    Object.assign(data, {
      file: stack[index].fileName,
      line: stack[index].lineNumber,
      row: stack[index].columnNumber
    })
  }

  if (ext.tag) {
    data.tag = ext.tag
    delete ext.tag
  }
  data.ext = JSON.stringify(ext)

  loggers.log(level, msg, data)

  return loggers
}

log.ERROR = 'error'
log.WARN = 'warn'
log.INFO = 'info'
log.VERBOSE = 'verbose'
log.DEBUG = 'debug'
log.SILLY = 'silly'

log.error = (msg, ext) => _log(msg, log.ERROR, ext)
log.warn = (msg, ext) => _log(msg, log.WARN, ext)
log.info = (msg, ext) => _log(msg, log.INFO, ext)
log.verbose = (msg, ext) => _log(msg, log.VERBOSE, ext)
log.silly = (msg, ext) => _log(msg, log.SILLY, ext)

export default log
