import { Tags } from 'opentracing'
import _ from 'lodash'

import { buildPath, handleErrorInSpan, ensureSampled } from './utils'

/**
 * 依赖apollo-server的extension，https://github.com/apollographql/apollo-server/blob/master/packages/graphql-extensions/src/index.ts
 */

export default class ApolloTracingExtension {
  requestDidStart (o) {
    const span = o.context.apolloTracingContext.startRequestSpan('apollo/request', {
      tags: {
        // Query Operation name. may be null
        operationName: o.operationName,
        query: o.queryString,
        variables: JSON.stringify(o.variables)
      }
    })

    return (...errors) => {
      if (errors.length > 0) {
        o.context.apolloTracingContext.hasErrors = true
        handleErrorInSpan(
          span,
          'Error during Request',
          errors.map((err) => err.stack).join('\n')
        )
      }

      // No longer convinced this is correct because parent traces
      // may not be sampled reducing value
      if (errors.length > 0 || o.context.apolloTracingContext.hasErrors) {
        ensureSampled(span)
      }

      span.finish()
    }
  }

  executionDidStart (o) {
    const apolloTracingContext = _.get(o, 'executionArgs.contextValue.apolloTracingContext', {})
    const span = apolloTracingContext.startExecuteSpan('apollo/execution')

    const { options, sequelize } = apolloTracingContext
    // 给sequelize增加tracing
    if (options.openSql && sequelize) {
      const resolveSpan = apolloTracingContext.startResolveSpan('apollo/execution/resolve', {
        tags: {
          [Tags.DB_STATEMENT]: 1
        }
      })
      sequelize.traceLog(resolveSpan)
    }

    return (...errors) => {
      // 自动finish resolveSpan, 一条请求有多个接口时会漏掉sql的日志，所以不能放到willResolveField里面
      const { resolveSpan } = apolloTracingContext
      if (resolveSpan && resolveSpan._duration === undefined) resolveSpan.finish()

      if (errors.length > 0) {
        apolloTracingContext.hasErrors = true

        handleErrorInSpan(
          span,
          'Error during Execution',
          errors.map((err) => err.stack).join('\n')
        )
      }

      if (errors.length > 0 || apolloTracingContext.hasErrors) {
        ensureSampled(span)
      }

      span.finish()
    }
  }

  willSendResponse (o) {
    o.context.apolloTracingContext.requestSpanLog({ event: 'apollo/willSendResponse' })
    return o
  }

  willResolveField (source, args, context, info) {
    const { apolloTracingContext } = context
    const path = buildPath(info.path)
    const span = apolloTracingContext.startWillResolvedFieldSpan(
      info,
      'apollo/willResolveField/' + path,
      {
        tags: {
          fieldName: info.fieldName,
          path,
          args: JSON.stringify(args)
        }
      }
    )

    return (err, result) => {
      if (err != null) {
        apolloTracingContext.hasErrors = true
        handleErrorInSpan(span, err.message, err.stack)
      }

      if (err != null || apolloTracingContext.hasErrors) {
        ensureSampled(span)
      }

      span.finish()
    }
  }
}
