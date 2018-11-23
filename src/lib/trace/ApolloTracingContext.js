import _ from 'lodash'

import { buildPath } from './utils'

/**
 * 修改udp传输限制 - Error: send EMSGSIZE
 * 查看(mac) sysctl net.inet.udp.maxdgram
 * 修改(mac) sudo sysctl net.inet.udp.maxdgram=65536
 * 阿里云log https://github.com/aliyun/aliyun-log-jaeger/blob/master/README_CN.md#%E9%94%99%E8%AF%AF%E8%AF%8A%E6%96%AD
 */

export default class ApolloTracingContext {
  req
  tracer
  sequelize

  requestSpan
  executeSpan
  resolveSpan

  options: Object

  resolverSpans: Map

  // Used to make sure we sample the entire request
  hasErrors: Boolean

  constructor(tracer, req, sequelize, options = {}) {
    this.req = req
    this.tracer = tracer
    this.sequelize = sequelize

    this.options = _.assign({openSql: true}, options)

    this.resolverSpans = new Map()
    this.hasErrors = false
    this._initSequelize()
  }

  get rootSpan() {
    const span = this.req.span

    if (span == null) {
      throw new Error('Root span is missing, make sure it is populated by your respective middleware')
    }

    return span
  }

  get ensureRequestSpan() {
    if (this.requestSpan == null) {
      throw new Error('Request Span is null')
    }

    return this.requestSpan
  }

  // 给sequelize初始化traceLog
  _initSequelize() {
    if (this.sequelize && !this.sequelize.traceLog) {
      this._initTraceLog()
    }
  }
  _initTraceLog() {
    this.sequelize.traceLog = (span) => {
      // 给所有model操作增加tracing
      this.sequelize.options.logging = (sql, milliseconds) => {
        const str = sql.replace(/Executed \([\W\w]+\)\: /, '')
        let event = 'MUTATION'

        if (str.startsWith('SELECT')) event = 'QUERY'
        if (str.startsWith('START TRANSACTION')) event = 'START TRANSACTION'
        if (str.startsWith('ROLLBACK')) event = 'ROLLBACK'
        if (str.startsWith('COMMIT')) event = 'COMMIT'
    
        span.log({
          event,
          value: `${sql}, Elapsed time: ${milliseconds}ms`
        })
      }
    }
  }

  ensureExecuteSpan() {
    if (this.executeSpan == null) {
      throw new Error('Execute Span is null')
    }

    return this.executeSpan
  }

  getParentResolverSpan(path) {
    let parentSpan
    let currentPath = path

    if (currentPath != null) {
      parentSpan = this.resolverSpans.get(buildPath(currentPath))
    }

    return parentSpan || this.ensureExecuteSpan()
  }

  /**
   * Start Resolve span, meant to be invoked from Userland resolvers
   * @param info
   * @param operationName
   * @param options
   */
  startResolverSpan(info, operationName, options = {}) {
    const path = info.path

    const span = this.tracer.startSpan(operationName, {
      childOf: this.getParentResolverSpan(path),
      ...options,
    })

    return span
  }

  /**
   * Meant to be called from Apollo Extensions
   * @param info
   * @param operationName
   * @param options
   */
  startWillResolvedFieldSpan(info, operationName, options = {}) {
    const path = info.path

    const span = this.tracer.startSpan(operationName, {
      childOf: this.getParentResolverSpan(path.prev),
      ...options,
    })

    this.resolverSpans.set(buildPath(path), span)

    return span
  }

  startRequestSpan(operationName, options = {}) {
    this.requestSpan = this.tracer.startSpan(operationName, {
      childOf: this.rootSpan,
      ...options,
    })

    return this.requestSpan
  }

  /**
   * TODO handling batching
   * @param operationName
   * @param options
   */
  startExecuteSpan(operationName, options = {}) {
    this.executeSpan = this.tracer.startSpan(operationName, {
      childOf: this.ensureRequestSpan,
      ...options,
    })

    return this.executeSpan
  }

  startResolveSpan(operationName, options = {}) {
    return this.resolveSpan = this.startSpan(operationName, options)
  }

  startSpan(operationName, options = {}) {
    return this.tracer.startSpan(operationName, {
      childOf: this.executeSpan,
      ...options
    })
  }

  requestSpanLog(keyValuePairs, timestamp) {
    this.ensureRequestSpan.log(keyValuePairs, timestamp)
  }
}
