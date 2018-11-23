import { ApolloServer } from 'apollo-server-express'
import express from 'express'
import middleware from 'express-opentracing'
import { initTracer, ApolloTracingContext, ApolloTracingExtension } from './index'

export async function run () {
  const serviceName = 'test-server'
  const tracer = initTracer(serviceName)
  const app = express()
  // 增加tracer中间件
  app.use(middleware({ tracer }))

  const apollo = new ApolloServer({
    schema,
    context: async ({ req }) => {
      const ctx = {
        // 实体化TracingContext，传到graphql的context里面
        apolloTracingContext: new ApolloTracingContext(tracer, req, sequelize)
      }
      return ctx
    },
    // 使用Apollo支持的extension
    extensions: [() => new ApolloTracingExtension()]
  })
}
