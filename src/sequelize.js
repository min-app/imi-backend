import Sequelize from 'sequelize'
import cls from 'continuation-local-storage'
import decamelize from 'decamelize'

import { dbCfg } from './config'

const namespace = cls.createNamespace('my-db-namespace')
Sequelize.useCLS(namespace)

const sequelize = new Sequelize(dbCfg.schema, dbCfg.user, dbCfg.password, dbCfg.options)

sequelize.beforeDefine((attributes, options) => options && (options.tableName = decamelize(options.modelName)))

sequelize.authenticate().then(() => {
  console.log('Connection has been established successfully.')
  // 测试连接成功 建表
  sequelize.sync().then(() => console.log('All tables has been created'))
}).catch(err => {
  console.error('Unable to connect to the database:', err)
})

export default sequelize
