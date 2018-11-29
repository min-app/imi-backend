import MG from 'mgs-graphql'
import Sequelize from 'sequelize'

const UserType = 'User'
const ProjectDetailType = 'ProjectDetail'

export default (sequelize: Sequelize) => {
  return MG
    .schema('Project', {
      description: 'project...',
      plugin: {
        addMutation: true,
        updateMutation: true,
        deleteMutation: true,
        singularQuery: true,
        pluralQuery: true
      },
      table: {
        hooks: {}
      }
    })
    .fields(fields)
    .hasMany({})
    .hasOne({
      projectDetail: {
        target: ProjectDetailType,
        foreignKey: 'project_id',
        hooks: true,
        onDelete: 'CASCADE'
      }
    })
    .queries({})
    .mutations({})
    .subscriptions({})
    .links({})
    .methods({})
    .statics({})
}

const fields = {
  title: {
    $type: String,
    required: true,
    description: 'title....'
  },
  user: {
    $type: UserType,
    required: true
  }
}
