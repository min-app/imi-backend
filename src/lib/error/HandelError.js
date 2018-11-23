import _ from 'lodash'

import { NoteError } from './ModelError'
import log from '../logs'

export default class HandelError {

  isOutputErrorLog: Boolean
  options: Object

  constructor(e, options = {}) {
    const defaultOptions = {
      isOutputErrorLog: true
    }
    this.options = _.defaults(options, defaultOptions)

    if (e instanceof Error) {
      this.error = e
      this._handelError()
    }
    this.error = e
  }

  _handelError() {
    this._writeError()
    this._throwError()
  }

  _throwError() {
    throw this.error
  }

  _writeError() {
    if (
      this.options.isOutputErrorLog && this.error instanceof NoteError && this.error instanceof TypeError
    ) {

      const ext = {}
      if (this.error.extra) {
        ext.extra = this.error.extra
      }

      log.error(this.error, ext)
    }
  }
}
