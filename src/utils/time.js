import moment from 'moment'

// 实例化时间
export const formatTime = (date = null, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) date = moment()
  return moment(date, format)
}
