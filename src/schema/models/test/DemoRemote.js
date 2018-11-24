import MG from 'mgs-graphql'
import Sequelize from 'sequelize'
import { withFilter } from 'graphql-subscriptions/dist/index'
import { toGlobalId } from 'graphql-relay'

import pubSub from '../../../pubsub'

const DemoChildrenType = 'DemoChildren'
const DemoChildType = 'DemoChild'
const DemoRemoteType = 'DemoRemote'
const RemoteClinicType = MG.remoteSchema('Clinic') // ?为什么这里能拿到远端的Clinic schema

const TEST_SUBSCRIPTION = 'TEST_SUBSCRIPTION'

export default (sequelize: Sequelize) => {
  return MG.schema('DemoRemote', {
    description: '用来测试调用微服务的schema',
    plugin: {
      singularQuery: false,
      pluralQuery: true,
      addMutation: true,
      deleteMutation: true,
      updateMutation: true
    },
    table: {
      paranoid: true, // 关闭物理删除 
      hooks: {
        // model钩子 
        beforeCreate: (instance, options) => {
          instance.clinicId = 1
        },
        afterCreate: async (instance, options) => {
          const { DemoChildren } = sequelize.models
          try {
            await DemoChildren.bulkCreate([
              { DemoRemoteId: instance.id, extraField: instance.id + '-0' },
              { DemoRemoteId: instance.id, extraField: instance.id + '-1' }
            ])
            pubSub.publish(TEST_SUBSCRIPTION, { data: 1, status: 1 })
          } catch (error) {
            throw new Error(error)
          }
        },
        beforeFind: (instance, options) => {
          console.log('beforeFind====>', instance)
          instance.order = [['id', 'desc']]
        },
        beforeUpdate: (instance, options) => {
          console.log('beforeUpdate====>', instance)
        },
        afterUpdate: (instance, options) => { }
      }
    }
  }).fields(fields)
    .hasMany({
      demoChildren: {
        target: DemoChildrenType,
        foreignKey: 'demo_remote_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        hooks: true
      }
    })
    .hasOne({
      demoChild: {
        target: DemoChildType,
        foreignKey: 'demo_remote_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        hooks: true
      }
    })
    .links({
      childrenCount: {
        description: '查询DemoRemote表下关联表DemoChildrend的数量',
        $type: Number,
        resolve: async (root, args, context, info, { models: { DemoChildren } }) => {
          return await DemoChildren.count({ where: { demoRemoteId: root.id } })
        }
      }
    })
    .statics({
      staticA: async params => {
        // 静态方法 example => DemoRemote.staticA 
      }
    })
    .methods({
      instanceA: async () => {
        // 实例方法 example => demoRemote.instanceA 
      }
    })
    .queries({
      globalRemote: {
        description: '全局调用远程微服务',
        args: {},
        $type: {
          code: String,
          id: RemoteClinicType
        },
        resolve: async (args, context, info, models) => {
          let { clinicBinding } = global.sgContext.bindings
          return await clinicBinding.query.clinic({ id: toGlobalId('Clinic', 1) }, '{ id,code }')
        }
      },
      instanceRemote: {
        description: 'services实例调用远程微服务',
        args: {},
        $type: {
          code: String,
          id: RemoteClinicType
        },
        resolve: async (args, context, info, { models, services: { ClinicService } }) => {
          // 实例使用 见 '../../services/clinic.js' 通用方法 
          return await ClinicService.getClinic({ id: toGlobalId('Clinic', 1) }, '{ id,code }')
        }
      }
    })
    .mutations({
      deleteDemoRemotes: {
        description: '自定义deleteMutation批量删除多条demo',
        inputFields: {
          ids: [DemoRemoteType]
        },
        outputFields: {
          code: Number,
          error: JSON
        },
        mutateAndGetPayload: async (args, context, info, { models: { DemoRemote } }) => {
          try {
            await DemoRemote.destroy({ where: { id: { [Sequelize.Op.in]: args.ids } } })
            return { code: 1 }
          } catch (error) {
            return { code: 0, error }
          }
        }
      }
    })
    .subscriptions({
      testSubscription: {
        description: 'testSubscription',
        resolve: async (payload, args, context, info, sgContext) => {
          return payload
        },
        $type: {
          code: Number
        },
        // Subscriptions resolvers are not a function, but an object with subscribe method, that returns AsyncIterable. 
        subscribe: withFilter(
          () => pubSub.asyncIterator(TEST_SUBSCRIPTION),
          (payload, variables) => {
            // payload == { data: 1, status: 1 } 
            console.log('test触发', payload)
            return { code: 1 }
          }
        )
      }
    })
}

const fields = {
  stringField: {
    $type: String,
    required: true,
    default: 'a',
    initalizable: true, // 可初始化 
    mutable: true, // 可变 
    description: 'String类型demo字段'
  },
  numberField: {
    $type: Number,
    column: {
      $type: Sequelize.NUMBER(10),
      unique: {
        msg: '不可以重复的字段'
      }
    },
    unique: true,
    required: false,
    description: 'Numbers类型demo字段'
  },
  booleanField: {
    $type: Boolean,
    required: false,
    default: false,
    description: 'Boolean类型demo字段'
  },
  dateField: {
    $type: Date,
    required: false,
    description: 'Date类型demo字段'
  },
  intField: {
    $type: Number,
    column: {
      type: Sequelize.INTEGER
    },
    required: false,
    default: 0,
    description: 'Int类型demo字段'
  },
  floatField: {
    $type: Number,
    default: 0.1,
    required: false,
    description: 'Float类型demo字段'
  },
  clinic: {
    $type: RemoteClinicType, // 其他微服务必须有个字段关联到本地的某张表 
    description: '远程服务schema的id'
  }
}
