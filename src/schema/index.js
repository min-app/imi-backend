import path from 'path'
import MG from 'mgs-graphql'

import cfg from '../gqlConfig'
import sequelize from '../sequelize'
import HandleError from '../lib/error/HandelError'
import { isOutputErrorLog } from '../config'

function listSchemas (dir) {
  const models = []
  const services = []
  MG.iterateFile(path.resolve(__dirname, dir), (path, fileName, isDirectory) => {
    if (isDirectory && fileName === '__tests__') {
      return false
    }
    if (!isDirectory && (fileName.match(/\.js$/) === null || fileName === 'index.js')) {
      return false
    }
    return true
  }).forEach(({ path, fileName }) => {
    const name = [path.replace(__dirname, '.'), fileName.replace('.js', '')].join('/').replace('\\', '/')
    const modelOrFun = require(name).default
    if (modelOrFun instanceof MG.Schema) {
      models.push(modelOrFun)
    } else if ((typeof modelOrFun) === 'function') {
      const model = modelOrFun(sequelize)
      if (model instanceof MG.Schema) {
        models.push(model)
      } else {
        console.log(`${name} is not valid schema or service`)
      }
    } else if (modelOrFun instanceof MG.Service) {
      services.push(modelOrFun)
    }
  })
  return {
    models,
    services
  }
}

function buildLocalSchemas (models, services, remoteCfg) {
  const result = MG.build({
    sequelize: sequelize,
    schemas: models,
    services: services,
    options: {
      hooks: [
        {
          description: 'Enable transaction on mutations',
          filter: ({ type }) => type === 'mutation',
          hook: async function ({ type, config }, { source, args, context, info, models }, next) {
            return sequelize.transaction(function (t) {
              return next()
            })
          }
        },
        {
          description: 'ACL hook example',
          filter: ({ type }) => type === 'query' || type === 'mutation',
          hook: async function ({ type, config }, { source, args, context, info, models }, next) {
            if (context.span) sequelize.traceLog(context.span)
            if (config.config && config.config.acl) {
              // console.log("ACL config for " + config.name + ":" + config.config.acl) 
            }
            return next()
          }
        },
        {
          description: 'mutation hook',
          filter: ({ type, config }) => type === 'mutation' && config.config && config.config.hook,
          hook: async function (action, invokeInfo, next) {
            return action.config.config.hook(action, invokeInfo, next)
          }
        },
        {
          description: 'keywords hook',
          filter: ({ type, config }) => type === 'query',
          hook: async function ({ type, config }, { source, args, context, info, models }, next) {
            if (args.keywords && args.keywords.fields) {
              // 转义特殊字符 
              args.keywords.value = args.keywords.value.replace(/(%|_|&|\?)/g, (s) => '\\' + s)
            }
            if (config.config && config.config.hook) {
              await config.config.hook({ type, config }, { source, args, context, info, models }, next)
            }
            return next()
          }
        }
      ],
      query: {
        viewer: 'FromModelQuery'
      },
      headerKeys: ['x-access-token', 'x-wx-access-token', 'x-user-access-token', 'x-fans-access-token', 'clinic-wx-doctor-token'],
      handleError: (e) => {
        return new HandleError(e, { isOutputErrorLog })
      }
    },
    remoteCfg: remoteCfg
  })
  const schema = result.graphQLSchema
  global.sgContext = result.sgContext

  return schema
}

// merge所有的本地schema和models下的schema 
function mergeSchema () {
  const { models, services } = listSchemas('./')
  return buildLocalSchemas(models, services, cfg)
}

module.exports = {
  mergeSchema,
  sequelize
}
