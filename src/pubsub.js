/**
 * github address: https://github.com/davidyaha/graphql-redis-subscriptions
 * */
import { RedisPubSub } from 'graphql-redis-subscriptions'
import { redisConfig } from './config'

export default new RedisPubSub({
  connection: {
    ...redisConfig,
    retry_strategy: options => Math.max(options.attempt * 100, 3000)
  }
})
