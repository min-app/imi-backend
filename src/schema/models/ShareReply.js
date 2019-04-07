import MG from 'mgs-graphql'
import Sequelize from 'sequelize'
import { fromGlobalId } from 'graphql-relay'

// import { NoteError } from '../../lib/error/ModelError'

const ShareType = 'Share'
const UserType = 'User'
const ShareReplyType = 'ShareReply'

export default (sequelize: Sequelize) => {
  return MG
    .schema('ShareReply', {
      description: '分享的回复',
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
    .links({
      subReplys: {
        description: '子回复',
        args: {},
        $type: `${ShareReplyType}Connection`,
        resolve: async (root, args, context, info, { models: { ShareReply } }) => {
          return MG.Connection.resolve(ShareReply, {
            ...args,
            condition: {
              topShareReplyId: root.id
            }
          })
        }
      },
      topShareReply: {
        description: '顶级对象',
        $type: ShareReplyType,
        resolve: async (root, args, context, info, { models: { ShareReply } }) => {
          return ShareReply.findOne({
            where: {
              id: root.topShareReplyId
            }
          })
        }
      },
      parentShareReply: {
        description: '父级对象',
        $type: ShareReplyType,
        resolve: async (root, args, context, info, { models: { ShareReply } }) => {
          return ShareReply.findOne({
            where: {
              id: root.parentShareReplyId
            }
          })
        }
      }
    })
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
    description: '回复内容',
    required: true
  },
  share: {
    $type: ShareType,
    required: true
  },
  user: {
    $type: UserType,
    description: '回复者',
    required: true
  },
  topShareReplyId: {
    $type: String,
    column: {
      set (value) {
        this.setDataValue('topShareReplyId', fromGlobalId(value).id)
      }
    },
    description: '回复对象'
  },
  parentShareReplyId: {
    $type: String,
    column: {
      set (value) {
        this.setDataValue('parentShareReplyId', fromGlobalId(value).id)
      }
    },
    description: '父级对象'
  }
}
