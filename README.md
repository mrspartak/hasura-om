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


//subscription
let unsub = om.subscribe({
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
}, ([err, data]) => {
    //so data will come in the same format as the query
})
```

The only control you have is fragments. So this library provides base fragments with all table fields without relations. Of course you need them, so you have many ways to do so.
```javascript

//here is an example of simple query
var [err, response] = orm.query({
    user: {}
})

//So here some examples with fields key
var [err, response] = orm.query({
    user: {
        fields: `
            name
            posts {
                title
            }
        `,
        
        //or
        fields: [
            'name',
            {
                key: 'posts',
                values: [
                    'title'
                ]
            }
        ],

        //or
        fields: {
            name: null,
            posts: {
                children: {
                    title: null
                }
            }
        }
    }
})

//or we can create new Fragment
let newFragment = new Fragment({
    name: 'some_unique_name',
    table: 'user',
    fields: `
        name
        posts {
            title
        }
    `//any from abobe
})
var [err, response] = orm.query({
    user: {
        fragment: newFragment
    }
})

//or even better, we can extend user fragments and use it anytime
orm.table('user').createFragment('some_unique_name', `
    name
    posts {
        title
    }
`)
var [err, response] = orm.query({
    user: {
        fragment: 'some_unique_name'
    }
})

//of course we can use other fragments to create new one
let baseUserFragment = orm.table('user').fragment('base')
let basePostFragment = orm.table('post').fragment('base')

orm.table('user').createFragment('some_unique_name', [
    baseUserFragment.gqlFields(),
    {
        key: 'posts',
        values: [
            basePostFragment.gqlFields(),
        ]
    }
])
```