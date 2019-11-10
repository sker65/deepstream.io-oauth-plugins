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