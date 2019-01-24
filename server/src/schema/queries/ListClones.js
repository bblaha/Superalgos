import {
  GraphQLList
} from 'graphql'

import {
  AuthentificationError
} from '../../errors'

import { CloneType } from '../types'
import { Clone } from '../../models'
import logger from '../../config/logger'
import getCloneStatus from '../../kubernetes/getClonePodStatus'
import getCloneLogs from '../../kubernetes/getClonePodLogs'
import { getJobNameFromClone } from '../../config/utils'

const args = {}

const resolve = async(parent, args, context) => {
  logger.debug('List Clones -> Entering Fuction.')

   if (!context.userId) {
     throw new AuthentificationError()
   }

   let clones = await Clone.find({
     authId: context.userId,
     active: true
   })

   for (var i = 0; i < clones.length; i++) {
      logger.debug('List Clones -> clone: %j', clones[i])
      let cloneName = getJobNameFromClone(clones[i])
      clones[i].state = await getCloneStatus(cloneName)
      clones[i].lastLogs = await getCloneLogs(cloneName)
   }
   return clones
}

const query = {
  clones: {
    type: new GraphQLList(CloneType),
    args,
    resolve
  }
}

export default query
