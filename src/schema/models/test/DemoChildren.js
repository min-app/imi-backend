import MG from 'mgs-graphql'
const DEMOREMOTE = 'DemoRemote'
export default (sequelize: Sequelize) => {
  return MG.schema('DemoChildren', {
    description: '一对一的字表demo',
    plugin: {
      singularQuery: true,
      pluralQuery: true,
      addMutation: true,
      deleteMutation: true,
      updateMutation: true
    },
    table: {
      hooks: {
        beforeDestroy: (instance, options) => {
          console.log('父表删除字表hook执行=====>', instance)
        }
      }
    }
  }).fields(fields)
}


const fields = {
  demoRemote: {
    $type: DEMOREMOTE,
    description: '父表主键id'
  },
  extraField: {
    $type: String,
    description: 'demo额外字段'
  }
}