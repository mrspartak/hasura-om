# Hasura object mapping library
![Node.js Package](https://github.com/mrspartak/hasura-om/workflows/Node.js%20Package/badge.svg) [![Coverage Status](https://coveralls.io/repos/github/mrspartak/hasura-om/badge.svg?branch=master)](https://coveralls.io/github/mrspartak/hasura-om?branch=master)

# Instalation
```
npm i hasura-om
```

# A problem
We have a microservice infrastructure and need cross-service transactions. One way to do it is to send a graphql query + variables to one service and perform a query there. So this library helps to send more standardized data via JS Objects.
If you know a better way to solve this problem, you are welcome to issues or email.

# A simple example
```javascript
const { Hasura } = require('hasura-om')

const om = new Hasura({
    graphqlUrl: 'your hasura endpoint',
    adminSecret: 'your hasura admin secret'
})
//this command loads data from Hasura about tables/fields/keys to build base table fragments for simple queries
await om.init()

//query 
let [err, result] = om.query({
    user: {
        where: {
            is_live: {
                _eq: true
            }
        },
        limit: 10,
        order_by: {
            rating: 'desc'
        }
    },
    pets: {
        where: {
            type: {
                _eq: 'dog'
            }
        },
        fields: `
            id
            name
        `
    }
})

/* 
result = {
    user: [
        {
            ...all_user_base_fields
        },
    ],
    pets: [
        {
            id,
            name
        }
    ]
} 
*/


//mutation
let [err, result] = om.mutate({
    user: {
        update: {
            where: {
                _eq: {
                    id: 666
                }
            },
            _inc: {
                money: 100
            }
        }
    },
    wallet: {
        insert: {
            objects: {
                user_id: 666,
                type: 'deposit',
                amount: 100
            }
        }
    }
})

/* 
result = {
    user: {
        update: [
            {
                id: 666,
                money: 100
                ...all_user_base_fields
            }
        ]
    },
    wallet: {
        insert: [
            {
                id: 1002,
                user_id: 666,
                type: 'deposit',
                amount: 100
                ...all_wallet_base_fields
            }
        ]
    }
} 
*/
```