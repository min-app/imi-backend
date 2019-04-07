import { ApolloServer } from 'apollo-server-express'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { createServer } from 'http'
import moment from 'moment'
// import middleware from 'express-opentracing'

import { mergeSchema } from './schema'
import { PORT, category } from './config'
import testRouter from './router/test'
// import { initTracer, ApolloTracingContext, ApolloTracingExtension } from './lib/trace'

// tracing 服务
// const tracer = initTracer(category, { logger: false })
const schema = mergeSchema()
// playground 配置
const GRAPHQL_PLAYGROUND_CONFIG = {
  folderName: 'Foo',
  settings: {
    'editor.cursorShape': 'line',
    'editor.fontSize': 14,
    'editor.reuseHeaders': true,
    'editor.theme': 'dark'
  }
}

const apollo = new ApolloServer({
  schema,
  introspection: true, // 生产环境NODE_ENV='production'下schema有问题
  playground: GRAPHQL_PLAYGROUND_CONFIG, // 生产环境NODE_ENV='production'下默认是关闭playground的，这里改成默认开启
  context: async ({ req }) => {
    if (req && req.headers) {
      const reqContext = global.reqContext = {
        headers: req.headers
        // apolloTracingContext: new ApolloTracingContext(tracer, req, sequelize)
      }
      return reqContext
    }
  },
  // extensions: [() => new ApolloTracingExtension()],
  subscriptions: {
    onConnect: connectionParams => connectionParams
  },
  formatError: error => {
    const message = {
      message: error.message,
      path: error.path,
      timeStamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      category
    }
    // gateway要通过message的传递详情，子服务单独调试直接return message
    return {
      ...message,
      message: JSON.stringify(message)
    }
  }
})

const app = express()
// app.use(middleware({ tracer }))
app.use(cors('*'))
app.use(bodyParser.json())
app.use('/test', testRouter)

const httpServer = createServer(app)
apollo.applyMiddleware({ app })
apollo.installSubscriptionHandlers(httpServer)

export async function run () {
  httpServer.listen({ port: PORT }, () => console.log(`🚀 Server ready at http://localhost:${PORT}${apollo.graphqlPath}`))
}
