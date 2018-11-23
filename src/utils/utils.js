import { fromGlobalId } from 'graphql-relay'
export function isGlobalId (id) {
  try {
    const obj = fromGlobalId(id)
    if (obj.id && obj.type) return true
  } catch (e) {
  }
  return false
}
