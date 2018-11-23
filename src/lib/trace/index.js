import { initTracer as init } from 'jaeger-client'
import _ from 'lodash'

export { default as ApolloTracingExtension } from './ApolloTracingExtension'
export { default as ApolloTracingContext } from './ApolloTracingContext'

export const initTracer = (serviceName, options = {}) => {
  const config = {
    serviceName,
    sampler: {
      type: 'const',
      param: 1
    },
    reporter: {
      logSpans: true
    }
  }

  const defualtOptions = {
    logger: {
      info (msg) {
        console.log('INFO ', msg)
      },
      error (msg) {
        console.error('ERROR', msg)
      }
    }
  }

  _.defaults(options, defualtOptions)
  return init(config, options)
}
