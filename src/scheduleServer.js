import { mergeSchema, sequelize } from './schema'
import testSchedule from './schedule/test'
// 定义数据库定时任务方法 => 比如查表啊 统计数据啊 
export async function run () {
  mergeSchema()
  testSchedule(sequelize)
}
