import MG from 'mgs-graphql'
import Sequelize from 'sequelize'

// import { NoteError } from '../../lib/error/ModelError'

const PlanType = 'Plan'

export default (sequelize: Sequelize) => {
  return MG
    .schema('PlanLog', {
      description: '计划执行的日志',
      plugin: {
        addMutation: true,
        deleteMutation: true,
        updateMutation: true,
        singularQuery: true,
        pluralQuery: true
      }
    })
    .fields(fields)
    .hasOne({})
    .hasMany({})
    .links({})
    .queries({})
    .mutations({})
    .subscriptions({})
    .methods({})
    .statics({})
}

const fields = {
  content: {
    $type: String,
    column: {
      type: Sequelize.TEXT
    },
    description: '记录详情',
    required: true
  },
  plan: {
    $type: PlanType,
    description: '所属计划',
    required: true
  }
}
