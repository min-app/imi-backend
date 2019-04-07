import MG from 'mgs-graphql'
import Sequelize from 'sequelize'

import { NoteError } from '../../lib/error/ModelError'
import { formatTime } from '../../utils/time'

const UserType = 'User'
const ShareType = 'Share'
const ShareCollectType = 'ShareCollect'
const ShareReplyType = 'ShareReply'

export default (sequelize: Sequelize) => {
  return MG
    .schema('Share', {
      description: '每日分享',
      plugin: {
        addMutation: true,
        deleteMutation: true,
        updateMutation: true,
        singularQuery: true,
        pluralQuery: true
      },
      table: {
        hooks: {
          beforeCreate: async (instance) => {
            await instance.checkLimit()
          }
        }
      }
    })
    .fields(fields)
    .hasOne({})
    .hasMany({
      shareCollects: {
        target: ShareCollectType,
        foreignKey: 'share_id',
        hooks: true,
        onDelete: 'CASCADE'
      },
      topShareReplys: {
        target: ShareReplyType,
        foreignKey: 'share_id',
        scope: {
          topShareReplyId: null
        },
        hooks: true,
        onDelete: 'CASCADE'
      }
    })
    .links({
      replyCount: {
        description: '评论数',
        $type: Number,
        resolve: async (root, args, context, info, { models: { ShareReply } }) => {
          return ShareReply.count({
            where: {
              shareId: root.id
            }
          })
        }
      },
      collectCount: {
        description: '收藏数',
        $type: Number,
        resolve: async (root, args, context, info, { models: { ShareCollect } }) => {
          return ShareCollect.count({
            where: {
              shareId: root.id
            }
          })
        }
      }
    })
    .queries({})
    .mutations({
      shareCollect: {
        description: '收藏/取消',
        inputFields: {
          shareId: {
            $type: ShareType,
            required: true
          },
          userId: {
            $type: UserType,
            required: true
          }
        },
        outputFields: {
          ok: Boolean
        },
        mutateAndGetPayload: async (args, context, info, { models: { ShareCollect } }) => {
          delete args.clientMutationId

          const shareCollect = await ShareCollect.findOne({
            attributes: ['id'],
            where: args
          })

          if (shareCollect) {
            await shareCollect.destroy()
          } else {
            await ShareCollect.create(args)
          }

          return {
            ok: true
          }
        }
      }
    })
    .subscriptions({})
    .methods({
      checkLimit: async function () {
        const { Share } = sequelize.models
        const instance = this

        const old = await Share.count({
          where: {
            userId: instance.userId,
            createdAt: {
              [Sequelize.Op.gt]: formatTime().startOf('d')
            }
          }
        })
        if (old > 0) throw new NoteError('每天只能发布一条分享')
      }
    })
    .statics({})
}

const fields = {
  content: {
    $type: String,
    column: {
      type: Sequelize.TEXT
    },
    description: '详情',
    required: true
  },
  user: {
    $type: UserType,
    description: '发布者',
    required: true
  }
}
