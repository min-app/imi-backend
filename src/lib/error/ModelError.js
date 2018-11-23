import BasicError from './BasicError'

class NoteError extends BasicError {}
class ModelError extends BasicError {}
class ModelNoteError extends NoteError {}

export {
  ModelError,
  ModelNoteError,
  NoteError
}
