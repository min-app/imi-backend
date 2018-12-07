##### 帮助文档
1. <a href="https://graphql.org" target="_blank">graphql</a>
2. <a href="http://docs.sequelizejs.com/" target="_blank">sequelize</a>
3. <a href="https://www.apollographql.com/docs/apollo-server/" target="_blank">apollo-server</a>
5. <a href="https://github.com/aliyun/aliyun-log-jaeger/blob/master/README_CN.md#%E9%94%99%E8%AF%AF%E8%AF%8A%E6%96%AD" target="_blank">Jaeger on Aliyun Log Service</a>

##### 部署相关@何涛
1. 拉取代码 git clone , git pull
2. 替换配置
3. 获取依赖的lib: bash deploy.sh
4. npm install
5. npm run kill && npm start
6. 开启计划任务(可选) npm run stop_schedule && npm run start_schedule

#### 开发相关@all
1. 获取依赖的lib: npm run lib && cd src/lib && npm install
2. 远程依赖schema
```
  // 1. 生成gql文件(A项目): npm run gql
  // 2. 使用gql文件: 复制A的gql文件到B项目的src/schema/remote目录，重命名a.gql
  // 3. 配置远程schema，src/gqlConfig.js下的Endpoints增加a的配置
  const Endpoints = {
    __pathCurr2GQL: './schema/remote',//don't modify it
    a: {
      uri: {
        host: '127.0.0.1', // a服务的地址
        port: '9529', // a服务的端口
        path: 'graphql' // graphql的路由
      },
      gql:{
        path:'a.gql'
      },
      valid:  true
    },
  }
  // 之后就可以在代码里面使用 global.sgContext.bindings.a 获取远程接口了
```
3. sequselize调试
```
  // 因为开启了trace，sequelize的logging被重写了
  // 本地调试可以修改src/config.js的logging: console.log
  // 然后修改src/httpServer.js 
  apolloTracingContext: new ApolloTracingContext(tracer, req, sequelize)
  -->
  apolloTracingContext: new ApolloTracingContext(tracer, req, sequelize, {openSql: false})
```


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






















