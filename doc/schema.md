#### schema书写规范
```
import MG from 'mgs-graphql'
import Sequelize from 'sequelize'
import { toGlobalId } from 'graphql-relay'
import { PubSub, withFilter } from 'graphql-subscriptions'

const pubSub = new PubSub()
const RemoteClinicType = MG.remoteSchema('Clinic')
const TaskType = 'Task'
const UserType = 'User'
const TEST_SUBSCRIPTION = 'TEST_SUBSCRIPTION'

/**
* 1. 除了明确的对象（User）可以不写description，所有的field query mutation link subscription必须写description
* 2. 尽量尽量尽量使用自动生成的和自带的方法，80%的功能sequelize都有实现，不要自己写
* 3. model.findOne findAll等查询时坚持要什么查什么要多少差多少原则，必须配置attributes(除非业务需要查所有)指定要使用的字段，include时也要指定
* 4. 禁止在循环里执行mysql的操作
*/
export default (sequelize: Sequelize) => {
  return MG
    .schema('User', {
      description: 'model description', // necessary
      plugin: {   // 自动生成操作，默认false
        addMutation: true,
        updateMutation: false,
        deleteMutation: false,
        singularQuery: false,
        pluralQuery: true
      },
      table: {    // sequelize的操作
        hooks: {  // 详情见http://docs.sequelizejs.com/manual/tutorial/hooks.html
          beforeCreate: (instance) => {}
        },
        indexes: {    // 详情见http://docs.sequelizejs.com/manual/tutorial/models-definition.html#indexes
        },
        scopes: {  // 详情见http://docs.sequelizejs.com/manual/tutorial/scopes.html
          active : {
            where : {
              active : true 
            }
          }
        }
      }
    })
    .fields(fields)
    .queries({
      demo: {
        description: 'query a user',
        args: {
          id: UserType,
          required: true
        },
        $type: UserType,
        resolve: async (args, context, info, {models: { User }}) => {
          return User.findById(args.id)
        }
      },
      demoRemote: {
        description: '调用clinic远程微服务demo',
        args: {},
        $type: {
          code: String,
          id: String
        },
        resolve: async (args, context, info, { models, services: { ClinicService } }) => {
          // 全局调用 
          // let { clinicBinding } = global.sgContext.bindings
          // return clinicBinding.query.clinic({ id: toGlobalId('Clinic', 1) }, '{ id,code }')

          // 实例定义  '../../services/clinic.js' 定义实例通用方法 
          return ClinicService.getClinic({ id: toGlobalId('Clinic', 1) }, '{ id,code }')
        }
      },
      demoScope: {
        description: 'scope用法的demo',
        args: {},
        $type: [UserType],
        resolve: async (args, context, info, { models: { User } }) => {
          return User.scope('active').findAll()
        }
      },
    })
    .mutations({
      updateUser: {
        description: '...',
        inputFields: {
          id: {
            $type: UserType,
            required: true
          },
          values: fields
        },
        outputFields: {
          changedUser: UserType
        },
        mutateAndGetPayload: async (args, context, info, {models: {User}}) => {
          /**
           * hooks = true
           * individualHooks = true bulkUpdate和update hooks都会触发 update多条数据就触发多次update的hook
           * individualHooks = false 只触发bulkUpdate 
           * 
           * hooks = false
           * individualHooks = true  update多条也只会触发多次update的hook
           * individualHooks = false 都不触发
           */
          const user = await User.findById(args.id)
          // 注意：这里使用user实例update会触发User的before/afterUpdate的hook，create destroy同理
          await user.update(args.values)
          // await User.update(values, {
          //   where,
          //   individualHooks: true,   // 同上，如果不配置则会出发before/afterBulkUpdate
          //   hooks : true
          // })
          
          return {
            changedUser: user
          }
        }
      }
    })
    .subscriptions({
      TEST_SUBSCRIPTION: { // 调用方法 pubSub.publish(TEST_SUBSCRIPTION, { data: 1, status: 1 })
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
    .links({
      taskCount: {
        description: '查询User下关联task的数量demo',
        $type: Number,
        resolve: async (root, args, context, info, { models: { Task } }) => {
          return await Task.count({ where: { userId: root.id } })
        }
      }
    })
    .methods({
      fn: async params => {
        // 实例方法 example => user.fn() 
      }
    })
    .statics({
      fn: async params => {
        // 静态方法 example => User.fn() 
      }
    })
    .hasMany({
      tasks: {
        target: TaskType,
        foreignKey: 'user_id',
        hooks: true,
        onDelete: 'CASCADE' // 关联删除，结合hooks: true使用，注意：如果User设置了paranoid为true，这里不会触发
      }
    })
}

const fields = {
  name: {
    $type: String,
    required: true,
    column: {   // seuqelize字段属性，http://docs.sequelizejs.com/manual/tutorial/models-definition.html 
      type: Sequelize.STRING(32),
      unique: {
        msg: 'name if unique...'
      },
      validate: {} // 验证 http://docs.sequelizejs.com/manual/tutorial/models-definition.html 
    },
    description: 'name...', // necessary
  },
  password: {
    $type: String,
    column: {
      set(val) {
        this.setDataValue('password', val + 'rand')      
      },
      get() {
        return this.getDataValue('password').replace('rand', '')
      }
    },
    required: true,
    description: '...'
  },
  clinic: {
    $type: RemoteClinicType, // 远程微服务的modelType
    description: '远程服务schema的id'
  }
}
```