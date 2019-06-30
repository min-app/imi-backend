import Sequelize from 'sequelize'
import schedue from 'node-schedule'
import moment from 'moment'
import API from 'co-wechat-api'
import { toGlobalId } from 'graphql-relay'

import { wxConfig, wxMiniConfig } from '../config'

// const api = new API(wxConfig.appid, wxConfig.secret)

export default async function (sequlize: Sequelize) {
  const startPlan = async () => {
    const { Plan, User, WxUser } = sequlize.models
    await Plan.update({
      status: 'underway'
    }, {
      where: {
        status: 'waiting',
        startTime: {
          [Sequelize.Op.lt]: new Date(moment())
        }
      }
    })
    /*
    const plans = await Plan.findAll({
      attributes: ['id', 'title', 'userId', 'startTime'],
      where : {
        status: 'waiting',
        startTime: {
          [Sequelize.Op.lt]: new Date(moment())
        }
      },
      logging: console.log
    })
    // console.log('plans', plans)
    const tempId = 'FZMNSpzhjEEkDM8AWD0unSV8D12h1PrDcQF_rDb5Eeo'
    const topColor = '#FF0000'
    const miniprogram = {
      appid: wxMiniConfig.appid,
    }
    const color = '#173177'
    
    for (const plan of plans) {
      const wxUser = await WxUser.findOne({
        attributes: ['openId'],
        where: { userId: plan.userId }
      })

      const data = {
        keyword1: {
          value: plan.title,
          color,
        },
        keyword2: {
          value: plan.startTime,
          color,
        },
        keyword3: {
          value: '请妥善安排行程',
          color,
        },
      }
      miniprogram.pagepath = `/pages/plan/info/index?id=${toGlobalId('Plan', plan.id)}`
      
      const res = await api.sendTemplate('oGOzx0GXQ1wCX6KgyVdDYhgA2RYI', tempId, null, topColor, data, miniprogram)
      console.log('res', res)
      throw new Error('123')
    }
    */
  }

  schedue.scheduleJob('0 8 * * *', async () => {
    await startPlan()
  })
}
