import MG from 'mgs-graphql'
import Sequelize from 'sequelize'

// import { NoteError } from '../../lib/error/ModelError'

const WxUserType = 'WxUser'
const PlanType = 'Plan'
const ShareType = 'Share'
const ShareReplyType = 'ShareReply'
const ShareCollectType = 'ShareCollect'

export default (sequelize: Sequelize) => {
  return MG
    .schema('User', {
      description: 'user...',
      plugin: {
        addMutation: true,
        deleteMutation: true,
        updateMutation: true,
        singularQuery: true,
        pluralQuery: true
      }
    })
    .fields(fields)
    .hasOne({
      wxUser: {
        target: WxUserType,
        foreignKey: 'user_id',
        hooks: true,
        onDelete: 'CASCADE'
      }
    })
    .hasMany({
      plans: {
        target: PlanType,
        foreignKey: 'user_id',
        hooks: true,
        onDelete: 'CASCADE'
      },
      shares: {
        target: ShareType,
        foreignKey: 'user_id',
        hooks: true,
        onDelete: 'CASCADE'
      },
      shareReplys: {
        target: ShareReplyType,
        foreignKey: 'user_id',
        hooks: true,
        onDelete: 'CASCADE'
      },
      shareCollects: {
        target: ShareCollectType,
        foreignKey: 'user_id',
        hooks: true,
        onDelete: 'CASCADE'
      }
    })
    .links({})
    .queries({})
    .mutations({})
    .subscriptions({})
    .methods({})
    .statics({})
}

const fields = {
  username: {
    $type: String,
    column: {
      type: Sequelize.STRING(32)
    },
    description: '昵称',
    required: true
  },
  phoneNumber: {
    $type: String,
    description: '手机号'
  },
  token: {
    $type: String,
    column: {
      type: Sequelize.STRING(32)
    },
    description: '用户登录的token'
  }
}
