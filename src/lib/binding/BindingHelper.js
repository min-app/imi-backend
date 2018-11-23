import _ from 'lodash'
import { toGlobalId, fromGlobalId } from 'graphql-relay'

import { isGlobalId } from './utils'

const DefaultService = 'clinicBinding'

export default class BindingHelper {

  data: any
  operation: String
  fieldName: String
  args: String
  infoOrQuery: String|Object
  autoEdges: Boolean
  serviceName: String
  service: Object
  bindings: Object
  options: Object
  context: Object
  transforms: Object
  delegateOptions: Object

  /**
   * option {
   *  operation: String           操作类型 query|mutation
   *  fieldName: String           操作名
   *  args: String                参数，可选
   *  infoOrQuery: String|Object  返回值结构
   *  bindings: Object            默认 global.sgContext.bindings
   *  serviceName: String         远程服务名
   *  service: Object             远程服务binding，传入时忽略serviceName
   * }
   */
  constructor() {
    const option = arguments.length > 0 ? arguments[0] : {}
    this.operation = _.get(option, 'operation', '')
    this.fieldName = _.get(option, 'fieldName', '')
    this.args = _.get(option, 'args', '')
    this.infoOrQuery = _.get(option, 'infoOrQuery', '')
    this.autoEdges = _.get(option, 'autoEdges', false)
    this.context = _.get(option, 'context', global.reqContext || {})
    this.transforms = _.get(option, 'transforms', {})
    this.bindings = _.get(option, 'bindings', global.sgContext.bindings)
    this.serviceName = _.get(option, 'serviceName', DefaultService)
    const service = _.get(option, 'service', null)
    if (service)
      this.service = service
    else if (this.serviceName)
      this.service = this.bindings[this.serviceName]

    this.initOptions(option)
  }

  initOptions(options = {}) {
    this.options = _.assign({
      args: this.args,
      infoOrQuery: this.infoOrQuery
    }, options)
    return this.options
  }

  initDelegateOptions(delegateOptions = {}) {
    return this.delegateOptions = _.assign({
      context: this.context,
      transforms: this.transforms
    }, delegateOptions)
  }

  /**
   * 请求远程接口
   * @param operation String  操作类型 query|mutation
   * @param fieldName String  操作名
   * @param options Object    请求参数
   * const binding = new BindingHelper({
          operation: 'mutation',
          fieldName: 'addExpressCompany',  //对应微服务的字段
          serviceName: 'clinicBinding', //微服务的名称
          infoOrQuery: '{id name code}', //需要返回的内容字段
        })
    binding.fetch('', '', {args, generate: true})
   * @return {Promise<*>}
   */
  async fetch(operation, fieldName, options = {}) {
    operation = operation || this.operation
    fieldName = fieldName || this.fieldName
    options = this.initOptions(options)

    if (operation === 'query')
      return this.query(fieldName, options)
    return this.mutation(fieldName, options)
  }

  /**
   * 请求远程接口
   * @param fieldName String  操作名
   * @param options Object    请求参数
   * @return {Promise<*>}
   */
  async query(fieldName, options = {}, delegateOptions = {}) {
    fieldName = fieldName || this.fieldName
    if (options.autoEdges || this.options.autoEdges) options.infoOrQuery = this.generateEdges(options.infoOrQuery || this.infoOrQuery)
    return this.data = await BindingHelper.PluralQuery(fieldName, this.initOptions(options), this.initDelegateOptions(delegateOptions))
  }

  /**
   * 通过主键查询单条数据
   * @param fieldName String model名，eg: doctor
   * @param search Int|Object 条件 eg 1 | {id: 1} | {phoneNumber: '18621312332'}
   * @param infoOrQuery String|Object 返回结构
   * @return {Promise<*>}
   */
  async findById(fieldName, search, infoOrQuery = '', delegateOptions = {}) {
    fieldName = fieldName || this.fieldName
    this.infoOrQuery = infoOrQuery || this.infoOrQuery

    if (typeof search !== 'object') {
      // 兼容处理未加密的id
      if (!isGlobalId(search))
        search = toGlobalId(fieldName.charAt(0).toUpperCase() + fieldName.slice(1), search)
      search = {id: search}
    }

    return this.data = await this.service.query[fieldName](search, this.infoOrQuery, this.initDelegateOptions(delegateOptions))
  }

  /**
   * 获取一条数据
   * @param fieldName
   * @param options
   * @return {Promise<*>}
   */
  async queryOne(fieldName, options = {}, delegateOptions = {}) {
    fieldName = fieldName || this.fieldName
    this.infoOrQuery = this.generateEdges(options.infoOrQuery || this.infoOrQuery)
    options = this.initOptions({
      ...options,
      infoOrQuery: this.infoOrQuery,
      args: {
        sort: [
          {field: 'id', order: 'DESC'}
        ],
        ...options.args,
        first: 1
      },
    })
    const data = await BindingHelper.PluralQuery(fieldName, options, this.initDelegateOptions(delegateOptions))
    return this.data = _.get(data, 'edges[0].node', null)
  }

  /**
   * 请求远程接口
   * @param fieldName String  操作名
   * @param options Object    请求参数
   * @return {Promise<*>}
   */
  async mutation(fieldName, options = {}, delegateOptions = {}) {
    fieldName = fieldName || this.fieldName
    return this.data = await BindingHelper.Mutation(fieldName, this.initOptions(options), this.initDelegateOptions(delegateOptions))
  }

  /**
   * 将数据库ID 转换成 relay id
   * @param type
   * @param id
   * @return int
   */
  static toRelayId(type, id) {
    return toGlobalId(type, id)
  }

  /**
   * 将relay id 转换成数据库id, 并验证类型
   * @param id
   * @param type
   * @return {*}
   */
  static toDatabaseId(id, type = undefined) {
    const typeId = fromGlobalId(id)
    if (type !== undefined) {
      if (type !== typeId.type) throw new Error(`${type} type is error`)
    }
    return typeId['id']
  }

  /**
   * 将通过接口查询到的结果集内的结果转换成ID数组
   * @param data
   * @param toDatabaseId
   * @return Array
   * @constructor
   */
  static GetObjectIds(data, toDatabaseId = true) {
    const edges = _.get(data, 'edges', [])
    if (edges.length > 0) {
      return edges.map(({node}) => toDatabaseId === true ? this.toDatabaseId(node.id) : node.id)
    }
    return []
  }

  /**
   * 单数查询
   * @param fieldName
   * @param infoOrQuery
   * @param args
   * @param service
   * @return {Promise<void>}
   * @constructor
   */
  static async SingularQuery(fieldName, options = {}, delegateOptions = {}) {
    const {
      infoOrQuery = '',
      args = {},
      service = DefaultService
    } = options
    try {
      const serviceBinding = global.sgContext.bindings[service]
      if (!serviceBinding) throw new Error('service binding is not defend')

      // console.log('args', args, infoOrQuery)
      const result = await serviceBinding.query[fieldName](args, infoOrQuery, delegateOptions)
      return result
    } catch (e) {
      const error = `SingularQuery function error fieldName: ${fieldName}, ${e.message}`
      console.error(error)
      throw new Error(e.message)
    }
  }

  static async CountQuery(fieldName, options, delegateOptions) {
    options.infoOrQuery = options.infoOrQuery || `
      {count}
    `
    return this.SingularQuery(fieldName, options, delegateOptions)
  }

  /**
   * 复数查询
   * @param fieldName
   * @param options
   * @return {Promise<void>}
   * @constructor
   */
  static async PluralQuery(fieldName, options, delegateOptions) {
    options.args = {
      first: 10000,
      ...options.args,
    }
    // console.log('options.args', options.args)

    return this.SingularQuery(fieldName, options, delegateOptions)
  }

  async pluralQueryIds(fieldName, options, ext = {}, delegateOptions = {}) {
    ext = _.assign({
      transformId: true,
      toArrayIds: true
    }, ext)
    options = {
      ...options,
      infoOrQuery: `
        {
          edges{
            node{
              id
            }
          }
        }
      `
    }
    console.log('options', options)
    const data = await BindingHelper.PluralQuery(fieldName, options, delegateOptions)
    return this.data = this.transformData(data, ext)
  }

  /**
   * 数组id转化
   * @param data {edges: [{node: {id: 'RG9jdG9yOjU1'}}]}
   * @param ext
   *  ext.transformId: Boolean id是否转为Int
   *  ext.toArrayIds: Boolean 是否转为id数组
   *
   * @return {*} [1] | ['RG9jdG9yOjU1'] | {edges: [{node: {id: 1}}]}
   */
  transformData(data, ext) {
    const transformId = _.get(ext, 'transformId', true)
    const toArrayIds = _.get(ext, 'toArrayIds', true)

    // 直接返回，不处理
    if (transformId === false && toArrayIds === false) return data

    let edges = _.get(data, 'edges', [])
    edges = edges.map(({node}) => {
      if (transformId && node.id) node.id = fromGlobalId(node.id).id
      if (toArrayIds) return node.id
      return {node}
    })
    if (toArrayIds === false) edges = {edges}
    return edges
  }

  /**
   * 复数ID查询
   * @param fieldName
   * @param options
   * @return {Promise<void>}
   * @constructor
   */
  static async PluralQueryIds(fieldName, options, delegateOptions = {}) {
    options = {
      ...options,
      infoOrQuery: `
        {
          edges{
            node{
              id
            }
          }
        }
      `
    }
    return this.PluralQuery(fieldName, options, delegateOptions)
  }

  /**
   * 增删改
   * @param fieldName 操作名(接口名)
   * @param options
   * options.input 必须，mutation的参数
   * options.infoOrQuery 操作返回，默认返回{ clientMutationId: "" }
   * options.generate 是否对infoOrQuery作处理
   * eg: BindingHelper.Mutation('addExpressCompany', {args, infoOrQuery: '{id name}', generate: true}) => { addedExpressCompanyEdge: { node: { id: 'RXhwcmVzc0NvbXBhbnk6NDQ3',name: 'test2' } } }
   * eg: BindingHelper.Mutation('addExpressCompany', {args, infoOrQuery: '{ addedExpressCompanyEdge { node { id name } } }'}) => { addedExpressCompanyEdge: { node: { id: 'RXhwcmVzc0NvbXBhbnk6NDQ3',name: 'test2' } } }
   * eg: BindingHelper.Mutation('addExpressCompany', {args}) => { clientMutationId: '1534416557499' }
   * @return {Promise<*>} { addedExpressCompanyEdge { node { id name } } }
   * @constructor
   */
  static async Mutation(fieldName, options, delegateOptions = {}) {
    let {
      args,
      infoOrQuery,
      service = DefaultService,
      generate = false
    } = options
    const serviceBinding = global.sgContext.bindings[service]

    if (_.isEmpty(args)) throw new Error('args is required')

    if (generate === true && infoOrQuery) infoOrQuery = this.generatePayload(fieldName, infoOrQuery)

    return serviceBinding.mutation[fieldName]({input: args}, infoOrQuery, delegateOptions)
  }

  generateEdges (output) {
    output = output || '{id}'
    if (output.indexOf('edges') === -1)
      output = `
        {
          edges {
            node ${output}
          }
        }
      `
    return output
  }

  /**
   * 根据操作名自动生成返回字段
   * @param fieldName 操作名
   * @param output 需要的字段 eg: { id name }
   * @return {string} 返回的字段 eg: { changedClinic { id name } }
   */
  static generatePayload (fieldName, output = '{id}') {
    const reg = /^(add|update|delete)/
    const modelName = fieldName.replace(reg, '')
    const operation = _.get(fieldName.match(reg), '[0]', '')

    switch (operation) {
      case 'add':
        return `
          {
            added${modelName}Edge {
              node
                ${output}
            }
          }
        `
        break
      case 'update':
        return `
          {
            changed${modelName}
              ${output}
          }
        `
        break
      case 'delete':
        return `
          {
            ok
          }
        `
        break
      default:
        return `
          {
            clientMutationId
          }
        `
        break
    }
  }


  static async AddMutation(apiField, options, delegateOptions = {}) {
    let {infoOrQuery, fields} = options
    const firstUpper = apiField.substring(0,1).toUpperCase()+apiField.substring(1)
    fields = (fields || ['id']).join(',')
    infoOrQuery = infoOrQuery || `{
      added${firstUpper}Edge{
        node{
          ${fields}
        }
      }
    }`
    options = {
      ...options,
      infoOrQuery
    }
    const PayLoad = await this.Mutation(`add${firstUpper}`, options, delegateOptions)
    const data = _.get(PayLoad, `added${firstUpper}Edge.node`, {})
    data.id = this.toDatabaseId(data.id)
    // console.log('data', data)
    return data
  }
}
