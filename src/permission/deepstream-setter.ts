import { Deepstream } from '@deepstream/server'
import TokenPermission from './token-permission'

const deepstream = new Deepstream({})

deepstream.set('permission', new TokenPermission({ clientId: "" }, deepstream.getServices()))

deepstream.start()
