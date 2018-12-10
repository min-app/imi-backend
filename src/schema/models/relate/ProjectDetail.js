import MG from 'mgs-graphql'
import Sequelize from 'sequelize'

const ProjectType = 'Project'

export default (sequelize: Sequelize) => {
  return MG
    .schema('ProjectDetail', {
      description: 'projectDetail...',
      plugin: {
        addMutation: true,
        updateMutation: true,
        deleteMutation: true,
        singularQuery: true,
        pluralQuery: true
      },
      table: {
        hooks: {
          beforeDestroy: (instance) => instance.checkDestroy().then()
        }
      }
    })
    .fields(fields)
    .hasMany({})
    .hasOne({})
    .queries({})
    .mutations({})
    .subscriptions({})
    .links({})
    .methods({
      checkDestroy: async function () {
        if (this.count === 0) throw new Error('存在数量为0的projectDetail，不能删除')
      }
    })
    .statics({})
}

const fields = {
  count: {
    $type: Number,
    default: 0,
    description: 'count....'
  },
  project: {
    $type: ProjectType,
    required: true
  }
}
