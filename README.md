##### 帮助文档
1. <a href="https://graphql.org" target="_blank">graphql</a>
2. <a href="http://docs.sequelizejs.com/" target="_blank">sequelize</a>
3. <a href="https://www.apollographql.com/docs/apollo-server/" target="_blank">apollo-server</a>
5. <a href="https://github.com/aliyun/aliyun-log-jaeger/blob/master/README_CN.md#%E9%94%99%E8%AF%AF%E8%AF%8A%E6%96%AD" target="_blank">Jaeger on Aliyun Log Service</a>
6. <a href='./doc/name.md'>命名规范</a>
7. <a href='./doc/schema.md'>schema书写规范</a>
8. <a href='./doc/webstorm.md'>webstorm自动生成代码（5星推荐）</a>

##### 部署相关@何涛
1. 拉取代码 git clone , git pull
2. 替换配置
3. 获取依赖的lib: bash deploy.sh
4. npm install
5. npm run kill && npm start
6. 开启计划任务(可选) npm run stop_schedule && npm run start_schedule

#### 开发相关@all
1. 获取依赖的lib: npm run lib && cd src/lib && npm install
2. 代码格式化 npm run format(必须执行)
3. 远程依赖schema
```
1. 生成gql文件(A项目): npm run gql
2. 使用gql文件: 复制A的gql文件到B项目的src/schema/remote目录，重命名a.gql
3. 配置远程schema，src/gqlConfig.js下的Endpoints增加a的配置
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
  }
}
之后就可以在代码里面使用 global.sgContext.bindings.a 获取远程接口了
```
4. sequselize调试
```
因为开启了trace，sequelize的logging被重写了
本地调试可以修改src/config.js的logging: console.log
然后修改src/httpServer.js 
apolloTracingContext: new ApolloTracingContext(tracer, req, sequelize)
-->
apolloTracingContext: new ApolloTracingContext(tracer, req, sequelize, {openSql: false})
```






















