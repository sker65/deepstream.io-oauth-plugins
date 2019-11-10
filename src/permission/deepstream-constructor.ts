import { Deepstream } from '@deepstream/server'

export const deepstream = new Deepstream({
    permission: {
        path: './permission/token-permission',
        options: {}
    }
})

deepstream.start()
