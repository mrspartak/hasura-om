---
title: Subscribing | Guide
---

# Subscribing

## Technology
So this is a bit tricky. If every graphql request is plain HTTP request with query/variables data. Subscription needs a websocket connection and a special handshake. Also every request is a bit different.
So thanks to [apollographql/subscriptions-transport-ws](https://github.com/apollographql/subscriptions-transport-ws) and [websockets/ws](https://github.com/websockets/ws) we can implement subscriptions `from the box`
If you need regular queries via WS transport, please open an issue.

## Connection
So ws link is grabbed from `graphqlUrl` setting, but you can set it manually by `wsUrl`. A connection is lazy, so it will be establised only when you will first time subscribe
```javascript
const { Hasura } = require('hasura-om')

const orm = new Hasura({
    graphqlUrl: 'hasura graphql endpoint',
    wsUrl: 'hasura ws endpoint',
    adminSecret: 'your hasura admin secret',
    wsConnectionSettings: {
        lazy: false //here you can set a connection just with Hasura object
    }
}) 
await orm.generateTablesFromAPI()
```

## Subscribing
Subscription is a regular query (select or aggregate, only one at a time) but you will get a response every time some fields in your request will change

```javascript
function usersOnline([err, data]) {
    //todo with data.count
}

let unsub = orm.subscribe({
    user: {
        aggregate: {
            where: { isOnline: { _eq: true } },
            count: {}
        }
    },
}, usersOnline)
```
unsub is a function to unsubscribe to updates. Just call unsub()

## Debuging connection
orm.$ws is an EventEmitter and will emit every event from a ws client

```javascript
let tsStart = new Date().getTime()
let timediff = function () {
    return `+${ ((new Date().getTime() - tsStart)/1000).toFixed(2) }s`
}

orm.$ws.on('connected', () => {
    console.log(timediff(), 'orm.$ws.on.connected')
})
orm.$ws.on('connecting', () => {
    console.log(timediff(), 'orm.$ws.on.connecting')
})
orm.$ws.on('reconnected', () => {
    console.log(timediff(), 'orm.$ws.on.reconnected')
})
orm.$ws.on('reconnecting', () => {
    console.log(timediff(), 'orm.$ws.on.reconnecting')
})
orm.$ws.on('disconnected', () => {
    console.log(timediff(), 'orm.$ws.on.disconnected')
})
orm.$ws.on('error', (data) => {
    console.log(timediff(), 'orm.$ws.on.error', data)
})
```