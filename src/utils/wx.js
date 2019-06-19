import rp from 'request-promise'

export const code2session = async (appid, secret, jsCode, grantType = 'authorization_code') => {
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${jsCode}&grant_type=${grantType}`
  return rp.get(url)
}
