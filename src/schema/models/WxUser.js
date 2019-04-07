import MG from 'mgs-graphql'
import Sequelize from 'sequelize'

// import { NoteError } from '../../lib/error/ModelError'

const UserType = 'User'

export default (sequelize: Sequelize) => {
  return MG
    .schema('WxUser', {
      description: '微信用户',
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
            await instance.createUser()
          }
        }
      }
    })
    .fields(fields)
    .hasOne({})
    .hasMany({})
    .links({})
    .queries({})
    .mutations({})
    .subscriptions({})
    .methods({
      createUser: async function () {
        const { User } = sequelize.models
        const instance = this

        const user = await User.create({ username: instance.nickName })
        instance.userId = user.id
      }
    })
    .statics({})
}

const language = {
  en: '英文',
  zh_CN: '简体中文',
  zh_TW: '繁体中文'
}

const fields = {
  nickName: {
    $type: String,
    column: {
      type: Sequelize.STRING(32)
    },
    description: '微信用户昵称',
    required: true
  },
  openId: {
    $type: String,
    column: {
      type: Sequelize.STRING(32),
      unique: {
        msg: 'openId不能重复'
      }
    },
    unique: true,
    description: '微信openId',
    required: true
  },
  unionId: {
    $type: String,
    column: {
      type: Sequelize.STRING(32)
    },
    description: '微信开放平台id'
  },
  gender: {
    $type: MG.ScalarFieldTypes.Int,
    type: {
      type: Sequelize.TINYINT(1)
    },
    default: 0,
    description: '性别：0-未知；1-男性；2-女性'
  },
  language: {
    $type: String,
    enumValue: Object.keys(language),
    description: '显示 country，province，city 所用的语言'
  },
  city: {
    $type: String,
    description: '所在城市'
  },
  province: {
    $type: String,
    description: '所在省'
  },
  country: {
    $type: String,
    description: '所在国家'
  },
  avatarUrl: {
    $type: String,
    description: '用户头像url'
  },
  user: {
    $type: UserType,
    initializable: false,
    description: '用户id',
    required: true
  }
}
