
class BasicError extends Error {
  constructor (message, extra = null) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
    this.message = message
    this.name = this.constructor.name
    if (extra) {
      this.extra = extra
    }
  }
}

export default BasicError
