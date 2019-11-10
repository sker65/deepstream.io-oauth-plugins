# Authentication with openid

This example uses openid as authentication method. As in rest requests the client provides the whole authentication header from browser context as 'authData' like

``` javascript
const deepstream = require("@deepstream/client");
const server = 'localhost:6020';
const tok = 'Bearer eyJhbGciOiJSUzI1N ...';

const client = new deepstream.DeepstreamClient(server);
client.login({ token: tok }).then(() => {
    console.log(`connected to ${server}`);
    client.event.subscribe('news/sports', (data) => {
        console.log(`received ${data}`);
    });
}).catch((e) => {
    console.log(`error logging in ${JSON.stringify(e)}`);
});
```
The bearer token gets validated against the configured issuer e.g. a keycloak server using the keycloak-connect module.
If token is valid, token contents (roles etc ...) are made available as "server data" for later use in permission evaluation based on token roles / username etc..

## permission checks

The TokenPermission plugin uses the jwt token that was validated in the auth plugin to apply arbitrary permission constraints based on token content be it username or typically roles.

To check if a subscription on a certain topic is allowed you would do something like:
``` javascript
    canPerformAction(socketWrapper: SocketWrapper, message: Message, callback: PermissionCallback, passItOn: any): void {

        const serverData = socketWrapper.serverData;

        const token = serverData ? JSON.parse(serverData.grant as string) : '';
        let errorMsg: string = "Permission not granted";
        if (message.topic === TOPIC.EVENT && message.action === EVENT_ACTION.SUBSCRIBE) {
            const channel = message.name;
            const route = new Route("projects/:project/*s");
            const m = channel ? route.match(channel) : false;
            if (m && this.hasRealmRole(token, `${m.project}-subscriber`)) {
                this.logger.info(EVENT.INFO, `subscription to ${channel} granted`);
                callback(socketWrapper, message, passItOn, null, true);
                return;
            }
        }
    }
```

But this is just ony example. You could also limit access to records in a simpler way.
You also use the token lifecycle to force reauthenticate with deepstream (or terminate the session).