
export function buildPath (path) {
  let current = path
  const segments = []

  while (current != null) {
    if (typeof current.key === 'number') {
      segments.push(`[${current.key}]`)
    } else {
      segments.push(current.key)
    }

    current = current.prev
  }

  return segments.reverse().join('.')
}

export function handleErrorInSpan (span, errorMessage, errorStack) {
  span.setTag('error', true)

  span.log({
    event: 'error',
    message: errorMessage,
    stack: errorStack
  })
}

export function ensureSampled (span) {
  span.setTag('sampling.priority', 1)
}
