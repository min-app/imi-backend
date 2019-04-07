import MG from 'mgs-graphql'
import Sequelize from 'sequelize'

// import { NoteError } from '../../lib/error/ModelError'

const UserType = 'User'
const ShareType = 'Share'

export default (sequelize: Sequelize) => {
  return MG
    .schema('ShareCollect', {
      description: '分享的收藏',
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
  // t: {
  //   $type: String
  // },
  user: {
    $type: UserType,
    required: true
  },
  share: {
    $type: ShareType,
    required: true
  }
}
