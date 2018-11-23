import path from 'path'
import _ from 'lodash'

/**
 * 远程调用的配置
 * 调用远端的微服务clinic
 */
const Endpoints = {
  __pathCurr2GQL: './schema/remote', // don't modify it 
  clinicBinding: {
    uri: {
      host: '120.78.229.105',
      port: '9528',
      path: 'graphql'
    },
    gql: {
      path: 'clinic.gql'
    },
    valid: true
  }
}

const currEndpoints = {}
_.forOwn(Endpoints, (value, key) => {
  if (value.gql && value.gql.path && value.valid) {
    value.gql.path = path.resolve(__dirname, Endpoints.__pathCurr2GQL, value.gql.path)

    currEndpoints[key] = value
  }
})

export default currEndpoints
