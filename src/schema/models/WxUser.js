import MG from 'mgs-graphql'
import Sequelize from 'sequelize'

import { NoteError } from '../../lib/error/ModelError'
import WXBizDataCrypt from '../../lib/wxMini/WXBizDataCrypt'
import { code2session } from '../../utils/wx'
import { wxMiniConfig } from '../../config'

const UserType = 'User'
const WxUserType = 'WxUser'

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
    .queries({
      getSessionKey: {
        description: '获取登录的session key',
        args: {
          jsCode: {
            $type: String,
            description: '登录时获取的 code',
            required: true
          },
          grantType: {
            $type: String,
            enumValue: ['authorization_code'],
            default: 'authorization_code'
          }
        },
        $type: {
          sessionKey: {
            $type: String,
            description: '会话密钥'
          },
          errcode: {
            $type: Number,
            description: '错误码'
          },
          errmsg: {
            $type: String,
            description: '错误信息'
          },
          openid: {
            $type: String,
            description: '微信小程序唯一标识'
          }
        },
        resolve: async ({ jsCode, grantType }) => {
          const session = await code2session(wxMiniConfig.appid, wxMiniConfig.secret, jsCode, grantType)
          console.log('session', session)

          return session
        }
      }
    })
    .mutations({
      encryptUserInfo: {
        description: '解密用户信息',
        inputFields: {
          jsCode: {
            $type: String,
            description: '登录时获取的 code'
          },
          sessionKey: {
            $type: String
          },
          iv: {
            $type: String,
            required: true
          },
          encryptedData: {
            $type: String,
            required: true
          }
        },
        outputFields: {
          wxUser: WxUserType
        },
        mutateAndGetPayload: async (args, context, info, { models: { WxUser } }) => {
          const { jsCode, iv, encryptedData } = args
          let { sessionKey } = args

          if (jsCode) {
            try {
              const res = await code2session(wxMiniConfig.appid, wxMiniConfig.secret, jsCode)
              sessionKey = JSON.parse(res).session_key
            } catch (e) {
              console.log('error', e)
              throw new NoteError('获取session异常')
            }
          }

          let wxUser = await WxUser.findOne({
            where: { sessionKey }
          })

          const pt = new WXBizDataCrypt(wxMiniConfig.appid, sessionKey)
          const userInfo = pt.decryptData(encryptedData, iv)
          console.log('userInfo', userInfo)
          const { openId, unionId } = userInfo

          if (unionId && !wxUser) {
            wxUser = await WxUser.findOne({
              where: {
                unionId
              }
            })
          }

          if (!wxUser) {
            wxUser = await WxUser.findOne({
              where: {
                openId
              }
            })
          }

          if (!wxUser) {
            wxUser = await WxUser.create(userInfo)
          }

          return {
            wxUser
          }
        }
      }
    })
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
  sessionKey: {
    $type: String,
    description: '小程序登录session'
  },
  user: {
    $type: UserType,
    initializable: false,
    description: '用户id',
    required: true
  }
}
