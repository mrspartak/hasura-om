---
home: true
heroImage: /hasura_icon_blue.svg
actionText: Get started
actionLink: /guide/
---
```
npm i hasura-om
```

```javascript
const { Hasura } = require('hasura-om')

const orm = new Hasura({
    graphqlUrl: 'your hasura endpoint',
    adminSecret: 'your hasura admin secret'
})
await orm.init()

let [err, result] = await orm.query({
    user: {
        where: { is_live: { _eq: true } },
        limit: 10,
        order_by: { rating: 'desc' }
    },
    pets: {
        select: {
            where: { type: { _eq: 'dog' } }
        },
        aggregate: {
            count: {},
            avg: ['age']
        }
    }
})
```