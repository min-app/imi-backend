import MG from 'mgs-graphql'
import Sequelize from 'sequelize'
import { toGlobalId } from 'graphql-relay'
import { PubSub, withFilter } from 'graphql-subscriptions'
const pubSub = new PubSub()
// import pubSub from '../../../pubsub'

const DemoChildrenType = 'DemoChildren'
const DemoChildType = 'DemoChild'
const DemoRemoteType = 'DemoRemote'
const RemoteClinicType = MG.remoteSchema('Clinic')

const TEST_SUBSCRIPTION = 'TEST_SUBSCRIPTION'

export default (sequelize: Sequelize) => {
  return MG.schema('DemoRemote', {
    description: '用来测试调用微服务的schema',
    plugin: {
      singularQuery: true,
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
          console.log('afterCreate===>', options)
          const { DemoChildren } = sequelize.models
          try {
            await DemoChildren.bulkCreate([
              { demoRemoteId: instance.id, extraField: instance.id + '-0' },
              { demoRemoteId: instance.id, extraField: instance.id + '-1' }
            ])
            pubSub.publish(TEST_SUBSCRIPTION, { data: 1, status: 1 })
          } catch (error) {
            throw new Error(error)
          }
        },
        beforeFind: (instance, options) => {
          console.log('beforeFind====>')
          instance.order = [['id', 'desc']]
        },
        beforeUpdate: (instance, options) => {
          console.log('beforeUpdate====>')
        },
        beforeBulkUpdate: (options) => {
          console.log('beforeBulkUpdate===>')
        },
        afterUpdate: (instance, options) => { }
      },
      indexes: [
        {
          // 单索引demo 
          fields: ['number_field']
        },
        {
          // 复合索引
          name: 'string_number_index',
          fields: ['stringField', 'numberField']
        }
      ],
      defaultScope: {
        //默认作用域 每次 .find, .findAll, .count, .update, .increment and .destroy都会带上 
        where: {
          id: {
            [Sequelize.Op.gte]: 2
          }
        }
      },
      scopes: {
        active: {
          where: {
            booleanField: true
          }
        },
        big(value) {
          return {
            where: {
              numberField: {
                [Sequelize.Op.gte]: value
              }
            }
          }
        }
      }
    }
  }).fields(fields)
    .hasMany({
      demoChildren: {
        target: DemoChildrenType,
        foreignKey: 'demo_remote_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        hooks: true // 会去触发demoChildren的钩子函数
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
          id: String
        },
        resolve: async (args, context, info, models) => {
          let { clinicBinding } = global.sgContext.bindings
          return clinicBinding.query.clinic({ id: toGlobalId('Clinic', 1) }, '{ id,code }')
        }
      },
      instanceRemote: {
        description: 'services实例调用远程微服务',
        args: {},
        $type: {
          code: String,
          id: String
        },
        resolve: async (args, context, info, { models, services: { ClinicService } }) => {
          // 实例使用 见 '../../services/clinic.js' 通用方法 
          return ClinicService.getClinic({ id: toGlobalId('Clinic', 1) }, '{ id,code }')
        }
      },
      demoScope: {
        description: 'scope用法的demo',
        args: {
          resource: {
            $type: MG.ScalarFieldTypes.Int,
            description: 'numberField的比较参考值 会通过scope查出大于该值的记录'
          }
        },
        $type: [DemoRemoteType],
        resolve: async (args, context, info, { models: { DemoRemote, DemoChildren } }) => {
          return DemoRemote.scope('active', { method: ['big', args.resource] }).findAll(
            {
              include: [
                {
                  model: DemoChildren, // 可以继续scope 
                  as: 'demoChildren',
                  where: sequelize.where(sequelize.fn('char_length', sequelize.col('extra_field')), 3)
                }
              ]
            }
          )
        }
      },
      demoSequelize: {
        description: 'sequelize rawQuery使用demo',
        args: {},
        $type: {
          code: Number
        },
        resolve: async (args, context, info, { models: { DemoRemote } }) => {
          /**
           * hooks = true
           * individualHooks = true bulkUpdate和update hooks都会触发 update多条数据就触发多次update的hook
           * individualHooks = false 只触发bulkUpdate 
           * 
           * hooks = false
           * individualHooks = true  update多条也只会触发多次update的hook
           * individualHooks = false 都不触发
           */
          await DemoRemote.update({ intField: 10 }, { where: { id: { [Sequelize.Op.in]: [3, 2] } }, individualHooks: true, hooks: false })
          return { code: 1 }
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
      TEST_SUBSCRIPTION: {
        description: 'testSubscription socket的demo',
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
            console.log('test触发', payload)  // 前端必须去subscriptions 才会触发
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
    initalizable: false, // 可初始化 
    mutable: false, // 可变 
    enumValues: ['a', 'b', 'c'],
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
