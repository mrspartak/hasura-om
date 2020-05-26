---
title: Getting started | Guide
---

# Getting started

## Installation

```
npm i hasura-om
```

## Initialization
```javascript
const { Hasura } = require('hasura-om')

const orm = new Hasura({
    graphqlUrl: 'your hasura endpoint',
    adminSecret: 'your hasura admin secret'
})
await orm.init()
```

Module hasura-om return all basic classes: Hasura, Table, Field, Fragment

orm.init() makes request to Hasura to get all tables, fields, primary keys and creates basic fragments for all tables


## Basic fragments

Read more about [creating fragments](/guide/create-fragment) or [fragment api](/api/fragment)

```javascript
let baseFragment = orm.table('user').fragment('base')
/* 
    Fragment base_fragment_user on user {
        id
        email
        password
        ...all plain fields from table or view
    }
*/

let pkFragment = orm.table('user').fragment('pk')
/* 
    Fragment pk_fragment_user on user {
        id
        //only primary keys from the table or view
    }
*/
```


## Basic query

Read more about [making queries](/guide/query)

```javascript
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
/* 
    {
        user: [{
            ...userFields
        },...],
        pets: {
            select: [{
                ...petsFields
            }, ...],
            aggregate: {
                count: 5,
                avg: { age: 3.5 }
            }
        }
    }
*/
```


## Basic mutation

Read more about [making mutations](/guide/mutation)

```javascript
let [err, result] = om.mutate({
    user: {
        update: {
            where: { _eq: { id: 666 } },
            _inc: { money: 100 }
        }
    },
    wallet: {
        insert: {
            objects: {
                user_id: 666,
                type: 'deposit',
                amount: 100
            },
            fragment: 'pk'
        }
    }
})
/* 
    {
        user: {
            update: [{
                    ...userFields
            },...]
        },
        wallet: {
            insert: [{
                id: 1002
            },...]
        }
    }
*/
```


## Basic subscription

Read more about [subscribing](/guide/subscribe)

```javascript
let unsub = om.subscribe({
    user: {
        aggregate: {
            where: { is_live: { _eq: true } },
            count: {},
        }
    }
}, ([err, data]) => {
    /* 
        data = {
            count: 5
        }
    */
})
```