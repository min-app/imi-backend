import MG from 'mgs-graphql'
import Sequelize from 'sequelize'

import { NoteError } from '../../lib/error/ModelError'
import { formatTime } from '../../utils/time'

const UserType = 'User'
const PlanLogType = 'PlanLog'

export default (sequelize: Sequelize) => {
  return MG
    .schema('Plan', {
      description: 'plan...',
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
          },
          beforeDestroy: (instance) => {
            // const diff = formatTime().diff(formatTime(instance.startTime)) / 1000
            // if (diff < 86400 * 3) throw new NoteError('计划开始前3天不能删除')
          }
        }
      }
    })
    .fields(fields)
    .hasOne({})
    .hasMany({
      planLogs: {
        target: PlanLogType,
        foreignKey: 'plan_id',
        hooks: true,
        onDelete: 'CASCADE'
      }
    })
    .links({})
    .queries({})
    .mutations({})
    .subscriptions({})
    .methods({
      checkLimit: async function () {
        // 检查限制
        const { Plan } = sequelize.models
        const instance = this

        const count = await Plan.count({
          where: {
            status: {
              [Sequelize.Op.ne]: 'finished'
            },
            userId: instance.userId
          }
        })
        if (count >= 3) throw new NoteError('未完成的计划不能超过3个')
      }
    })
    .statics({})
}

const status = {
  waiting: '未开始',
  underway: '进行中',
  finished: '已完成'
}

const fields = {
  title: {
    $type: String,
    column: {
      type: Sequelize.STRING(16),
      validate: {
        len: {
          args: [0, 16],
          msg: '标题最多16个字'
        }
      }
    },
    description: '计划标题',
    required: true
  },
  detail: {
    $type: String,
    column: {
      type: Sequelize.TEXT
    },
    description: '计划详情',
    required: true
  },
  status: {
    $type: String,
    enumValues: Object.keys(status),
    description: '状态',
    default: 'waiting'
  },
  startTime: {
    $type: Date,
    column: {
      type: Sequelize.DATE,
      validate: {
        to (value) {
          const tomorrow = formatTime(new Date()).add(1, 'd')
          const diff = formatTime(value).diff(tomorrow)
          if (diff < 0) throw new NoteError('计划开始时间不得小于第二天')
        }
      }
    },
    mutable: false,
    description: '开始执行时间',
    required: true
  },
  endTime: {
    $type: Date,
    column: {
      type: Sequelize.DATE,
      validate: {
        maxL (value) {
          const startTime = formatTime(this.getDataValue('startTime'))
          const diff = formatTime(value).diff(startTime) / 1000

          if (diff < 3 * 86400) throw new NoteError('计划周期不得小于3天')
          if (diff > 60 * 86400) throw new NoteError('计划周期不得大于60天')
        }
      }
    },
    mutable: false,
    description: '预计完成时间',
    required: true
  },
  isPublic: {
    $type: Boolean,
    description: '是否公开',
    default: false
  },
  user: {
    $type: UserType,
    description: '所属人',
    required: true
  },
  supervisor: {
    $type: UserType,
    description: '计划的监督者'
  }
}
