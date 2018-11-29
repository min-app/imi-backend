import MG from 'mgs-graphql'
import Sequelize from 'sequelize'

const UserType = 'User'
const ProjectType = 'Project'

export default (sequelize: Sequelize) => {
  return MG
    .schema('User', {
      description: 'user....',
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
    .hasMany({
      projects: {
        target: ProjectType,
        foreignKey: 'user_id',
        hooks: true,
        onDelete: 'CASCADE'
      }
    })
    .hasOne({})
    .queries({})
    .mutations({})
    .subscriptions({})
    .links({})
    .methods({})
    .statics({})
}

const fields = {
  username: {
    $type: String,
    unique: true,
    required: true,
    column: {
      type: Sequelize.STRING(32),
      unique: {
        mgs: '用户名已存在'
      }
    },
    description: 'username...'
  }
}
