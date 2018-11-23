import MG from 'mgs-graphql'
import BindingHelper from '../../lib/binding/BindingHelper'
const REMOTE_MODEL_NAME = 'Clinic'

export default MG.service('ClinicService').statics({
  getRemoteModelName: () => REMOTE_MODEL_NAME,
  getClinic: async (args, infoOrQuery = `{id,code}`) => {
    let clinic = await BindingHelper.SingularQuery('clinic', { args, infoOrQuery })
    return clinic
  }
})
