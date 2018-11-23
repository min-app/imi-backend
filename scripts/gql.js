import fs from 'fs'
import path from 'path'
import { printSchema } from 'graphql'

import { mergeSchema } from '../src/schema'

const filename = path.resolve(__dirname, './schema.gql')

try {
  console.log('start print...')
  fs.writeFileSync(filename, printSchema(mergeSchema()))
  console.log('start print succeed')
  process.exit()
} catch (e) {
  console.log('print error ', e)
}
