import MG from 'mgs-graphql'
import Sequelize from 'sequelize'

const DemoRemoteType = 'DemoRemote'

export default (sequelize: Sequelize) => {
  return MG.schema('DemoChild', {
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
      }
    }
  }).fields(fields)
}

const fields = {
  demoRemote: {
    $type: DemoRemoteType,
    description: '父表主键Id'
  },
  extraField: {
    $type: String,
    description: 'demo额外字段'
  }
}
