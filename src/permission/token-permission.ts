import { DeepstreamPlugin, DeepstreamServices, DeepstreamPermission, PermissionCallback, SocketWrapper, EVENT } from '@deepstream/types'
import { Message } from '@deepstream/protobuf/dist/types/messages';
import { TOPIC, EVENT_ACTION } from '@deepstream/protobuf/dist/types/all';
import Route = require('route-parser');

interface TokenPermissionOptions {
    clientId: string;   // client to check for roles
}

export default class TokenPermission extends DeepstreamPlugin implements DeepstreamPermission {

    public description = 'Token based permissions';
    private logger = this.services.logger.getNameSpace('TOKEN_PERMISSION')
    private clientId: string;

    constructor(private pluginOptions: TokenPermissionOptions, private services: Readonly<DeepstreamServices>) {
        super()
        this.clientId = pluginOptions.clientId;
    }

    private hasApplicationRole(token: any, role: string) {
        if (token.access_token && token.access_token.content && token.access_token.content.resource_access
            && token.access_token.content.resource_access[this.clientId]) {
            const roles: string[] = token.access_token.content.resource_access[this.clientId].roles;
            return roles.includes(role);
        }
        return false;
    }

    private hasRealmRole(token: any, role: string) {
        if (token.access_token && token.access_token.content && token.access_token.content.realm_access) {
            const roles: string[] = token.access_token.content.realm_access.roles;
            return roles.includes(role);
        }
        return false;
    }

    /**
     * The permission API is more functional due to the performance implications in deepstream, hence we path through alot of the data! This 
     * also allows you to go a bit crazy with implementations.
     * 
     * Whats important is you return an error or valid callback per permission, and keep in mind event though it is async you really want this
     * to be as quick and lightweight as possible!
     * 
     * You have full access to the message via the `message` object and `authData` which is the `serverData` returned via the authentication plugin.
     */
    canPerformAction(socketWrapper: SocketWrapper, message: Message, callback: PermissionCallback, passItOn: any): void {

        const serverData = socketWrapper.serverData;

        const token = serverData ? JSON.parse(serverData.grant as string) : '';
        let errorMsg: string = "Permission not granted";
        // example for subscription message
        // message: {"topic":4,"names":["projects/tasksystem-test-project/task-system/task"],"action":3,"correlationId":"0","name":"projects/tasksystem-test-project/task-system/task"}

        // these checks are just examples:
        // limit subscription based on 'path' of topic and corrosponding realm role or application role
        // application (or clientId that was requesting the token) can configured via options
        // to get a better understanding what is in the token, check jwt.io or just log to console
        if (message.topic === TOPIC.EVENT && message.action === EVENT_ACTION.SUBSCRIBE) {
            const channel = message.name;
            const route = new Route("projects/:project/*s");
            const m = channel ? route.match(channel) : false;
            if (m && this.hasRealmRole(token, `${m.project}-subscriber`)) {
                this.logger.info(EVENT.INFO, `subscription to ${channel} granted`);
                callback(socketWrapper, message, passItOn, null, true);
                return;
            }
            if (m && this.hasApplicationRole(token, `${m.project}-viewer`)) {
                this.logger.info(EVENT.INFO, `subscription to ${channel} granted`);
                callback(socketWrapper, message, passItOn, null, true)
                return
            }
            errorMsg = `subscription to ${channel} NOT granted`;
        }

        callback(socketWrapper, message, passItOn, errorMsg, false)
    }
}